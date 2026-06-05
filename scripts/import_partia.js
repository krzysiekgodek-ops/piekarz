#!/usr/bin/env node
/**
 * EBRA Piekarz — Import przepisów do Firestore
 * Projekt:   masarski-pro-v2
 * Kolekcja:  piekarz_przepisy
 *
 * Uruchom z katalogu: D:\DEV\EBRA\piekarz-claude\scripts\
 *
 * Użycie:
 *   node import_partia.js --dry-run partia_01_polska   (podgląd bez zapisu)
 *   node import_partia.js partia_01_polska              (wgrywa do Firestore)
 *   node import_partia.js --all                         (wgrywa wszystkie 10 partii)
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// ─── KONFIGURACJA ─────────────────────────────────────────────────
const PROJECT_ID    = 'masarski-pro-v2';
const COLLECTION    = 'piekarz_przepisy';  // osobna od piekarz_recipes (kalkulator)
const PRZEPISY_DIR  = path.join(__dirname, '..', 'przepisy');
const SERVICE_KEY   = path.join(__dirname, 'serviceAccountKey.json');
const DEFAULT_IMAGE = 'https://piekarz.ebra.pl/wzorzec.jpg';  // placeholder do czasu wgrania właściwego zdjęcia
// ──────────────────────────────────────────────────────────────────

// Sprawdź klucz serwisowy
if (!fs.existsSync(SERVICE_KEY)) {
  console.error(`
❌ Brak pliku serviceAccountKey.json!
   Oczekiwana ścieżka: ${SERVICE_KEY}

   Jak go pobrać:
   1. Otwórz: https://console.firebase.google.com
   2. Projekt: masarski-pro-v2
   3. ⚙️ Project Settings → Service accounts
   4. Kliknij "Generate new private key"
   5. Zmień nazwę na serviceAccountKey.json
   6. Wklej do: D:\\DEV\\EBRA\\piekarz-claude\\scripts\\
`);
  process.exit(1);
}

// Sprawdź katalog przepisów
if (!fs.existsSync(PRZEPISY_DIR)) {
  console.error(`
❌ Brak katalogu przepisy!
   Oczekiwana ścieżka: ${PRZEPISY_DIR}

   Przenieś lub skopiuj folder przepisy/ do:
   D:\\DEV\\EBRA\\piekarz-claude\\przepisy\\
`);
  process.exit(1);
}

// Inicjalizacja Firebase Admin
admin.initializeApp({
  credential:  admin.credential.cert(require(SERVICE_KEY)),
  projectId:   PROJECT_ID,
  databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ─── IMPORT JEDNEJ PARTII ─────────────────────────────────────────

async function importPartia(nazwaPliku, dryRun = false) {
  const plikPath = path.join(PRZEPISY_DIR, `${nazwaPliku}.json`);

  if (!fs.existsSync(plikPath)) {
    console.error(`❌ Nie ma pliku: ${plikPath}`);
    return { ok: 0, err: 1 };
  }

  let dane;
  try {
    dane = JSON.parse(fs.readFileSync(plikPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Błąd parsowania JSON: ${e.message}`);
    return { ok: 0, err: 1 };
  }

  const przepisy = dane.przepisy || [];
  console.log(`\n📂 ${nazwaPliku}.json  →  ${przepisy.length} przepisów`);
  if (dryRun) console.log('   ⚠️  DRY-RUN — nic nie jest zapisywane do Firestore\n');

  let ok = 0, err = 0;
  const BATCH_SIZE = 400; // Firestore limit: 500 operacji per batch

  for (let i = 0; i < przepisy.length; i += BATCH_SIZE) {
    const chunk = przepisy.slice(i, i + BATCH_SIZE);

    if (dryRun) {
      chunk.forEach(p => {
        console.log(`   [DRY] ${COLLECTION}/${p.id}  →  "${p.nazwa}"`);
      });
      ok += chunk.length;
      continue;
    }

    const batch = db.batch();
    chunk.forEach(przepis => {
      const docRef = db.collection(COLLECTION).doc(przepis.id);
      batch.set(docRef, {
        ...przepis,
        imageUrl:     przepis.imageUrl || DEFAULT_IMAGE,  // wzorzec.jpg dopóki nie ma właściwego zdjęcia
        _importowano: admin.firestore.FieldValue.serverTimestamp(),
        _partia:      nazwaPliku,
      });
    });

    try {
      await batch.commit();
      ok += chunk.length;
      process.stdout.write(`   ✅ Zapisano ${ok}/${przepisy.length}...\r`);
    } catch (e) {
      console.error(`\n   ❌ Błąd batch commit: ${e.message}`);
      err += chunk.length;
    }
  }

  const status = err === 0 ? '✅' : '⚠️ ';
  console.log(`   ${status} Wynik: ${ok} wgrano, ${err} błędów           `);
  return { ok, err };
}

// ─── MAIN ─────────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2);
  const dryRun  = args.includes('--dry-run');
  const all     = args.includes('--all');
  const partie  = args.filter(a => !a.startsWith('--'));

  if (args.length === 0) {
    console.log(`
Użycie:
  node import_partia.js --dry-run partia_01_polska     (podgląd)
  node import_partia.js partia_01_polska                (wgrywa)
  node import_partia.js --all                           (wszystkie 10)
  node import_partia.js --dry-run --all                 (podgląd wszystkich)
`);
    process.exit(0);
  }

  console.log(`
${'═'.repeat(58)}
  EBRA PIEKARZ — Import przepisów do Firestore
  Projekt:   ${PROJECT_ID}
  Kolekcja:  ${COLLECTION}
  Tryb:      ${dryRun ? '🔍 DRY-RUN (bez zapisu)' : '🚀 PRODUKCJA'}
${'═'.repeat(58)}`);

  let totalOk = 0, totalErr = 0;

  if (all) {
    const pliki = fs.readdirSync(PRZEPISY_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort();

    console.log(`\n  Znaleziono ${pliki.length} plików do importu:`);
    pliki.forEach(p => console.log(`    • ${p}`));

    for (const plik of pliki) {
      const { ok, err } = await importPartia(plik, dryRun);
      totalOk  += ok;
      totalErr += err;
      if (!dryRun && pliki.indexOf(plik) < pliki.length - 1) {
        await new Promise(r => setTimeout(r, 2000)); // pauza między partiami
      }
    }
  } else {
    for (const partia of partie) {
      const { ok, err } = await importPartia(partia, dryRun);
      totalOk  += ok;
      totalErr += err;
    }
  }

  console.log(`
${'═'.repeat(58)}
  PODSUMOWANIE
  Wgrano:   ${totalOk} przepisów
  Błędów:   ${totalErr}
${'═'.repeat(58)}
`);
  if (!dryRun && totalErr === 0) {
    console.log(`  ✅ Sprawdź w Firebase Console:`);
    console.log(`     https://console.firebase.google.com/project/${PROJECT_ID}/firestore`);
    console.log(`     Kolekcja: ${COLLECTION}\n`);
  }

  process.exit(totalErr > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('\n❌ Błąd krytyczny:', e.message);
  process.exit(1);
});
