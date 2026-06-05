#!/usr/bin/env node
/**
 * EBRA Piekarz — Import przepisów do Firestore
 * Projekt:   masarski-pro-v2
 * Kolekcja:  piekarz_recipes  (z ownerId: 'ADMIN' — widoczne dla wszystkich)
 *
 * Konwertuje format JSON (gramy) → format kalkulatora (procenty piekarskie)
 *
 * Użycie (z katalogu scripts/):
 *   node import_partia.js --dry-run partia_01_polska
 *   node import_partia.js partia_01_polska
 *   node import_partia.js --all
 *   node import_partia.js --cleanup          (usuwa błędnie wgrane piekarz_przepisy)
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// ─── KONFIGURACJA ─────────────────────────────────────────────────
const PROJECT_ID    = 'masarski-pro-v2';
const COLLECTION    = 'piekarz_recipes';       // kolekcja kalkulatora
const OLD_COLLECTION = 'piekarz_przepisy';     // błędna kolekcja — do wyczyszczenia
const PRZEPISY_DIR  = path.join(__dirname, '..', 'przepisy');
const SERVICE_KEY   = path.join(__dirname, 'serviceAccountKey.json');
const DEFAULT_IMAGE = 'https://piekarz.ebra.pl/wzorzec.jpg';
// ──────────────────────────────────────────────────────────────────

if (!fs.existsSync(SERVICE_KEY)) {
  console.error(`\n❌ Brak serviceAccountKey.json w: ${SERVICE_KEY}\n`);
  process.exit(1);
}
if (!fs.existsSync(PRZEPISY_DIR)) {
  console.error(`\n❌ Brak katalogu przepisy/\n`);
  process.exit(1);
}

admin.initializeApp({
  credential:  admin.credential.cert(require(SERVICE_KEY)),
  projectId:   PROJECT_ID,
});
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ─── MAPOWANIE KATEGORII ──────────────────────────────────────────
// Istniejące + nowe kategorie które doda skrypt
const KATEGORIE_MAPA = [
  { test: p => /orkisz/i.test(p.podtyp + p.tagi?.join(' ')),                  kat: 'Chleby orkiszowe'     },
  { test: p => /żytni|żytno|razow/i.test(p.podtyp),                           kat: 'Chleby żytnio-pszenne'},
  { test: p => p.tagi?.includes('żytni') && !p.tagi?.includes('pszenny'),     kat: 'Chleby żytnio-pszenne'},
  { test: p => /bułki|drożdżow|rogalik|croissant|parowy/i.test(p.podtyp),     kat: 'Bułki i drożdżowe'   },
  { test: p => /bezglutenow|keto|niskowęglo|pełnoziarnist|zdrowy/i.test(p.podtyp + p.tagi?.join(' ')), kat: 'Chleby zdrowe' },
  { test: p => p._partia === 'partia_10_swiateczne',                           kat: 'Chleby świąteczne'   },
  { test: p => /afryka|azja|ameryk|śródziemnomorze/i.test(p._partia || ''),    kat: 'Pieczywo Świata'     },
  { test: p => /europa/i.test(p._partia || '') && p._partia !== 'partia_01_polska', kat: 'Pieczywo Świata' },
];

function deriveCategory(przepis, partia) {
  const ctx = { ...przepis, _partia: partia };
  for (const { test, kat } of KATEGORIE_MAPA) {
    if (test(ctx)) return kat;
  }
  return 'Chleby pszenne'; // domyślna
}

// ─── KONWERSJA SKŁADNIKÓW ─────────────────────────────────────────
const FLOUR_KEYWORDS = [
  'mąka','mąki','semolina','kasza manna','kasza gryczana','płatki owsiane',
  'masa harina','masarepa','polenta','teff','atta','maida','mąka ryżowa',
  'mąka kukurydziana','mąka gryczana','mąka jaglana','mąka kokosowa',
  'mąka migdałowa','mąka orkiszowa','mąka żytnia','mąka pszenna',
  'skrobia','tapioka','psyllium','whey protein','mąka z tapioki',
];
function isFlour(nazwa) {
  const n = (nazwa || '').toLowerCase();
  return FLOUR_KEYWORDS.some(k => n.includes(k));
}

function gramyNaProcenty(skladniki) {
  const flourItems = skladniki.filter(s => isFlour(s.nazwa));
  const otherItems = skladniki.filter(s => !isFlour(s.nazwa));
  const totalG     = flourItems.reduce((sum, f) => sum + (Number(f.ilosc) || 0), 0) || 100;

  const flours = flourItems.map(f => ({
    name:    f.nazwa,
    percent: Math.round((f.ilosc / totalG) * 100 * 10) / 10,
    kg:      0,
  }));

  const ingredients = otherItems.map(ing => ({
    name:    ing.nazwa,
    percent: Math.round((ing.ilosc / totalG) * 100 * 10) / 10,
    unit:    ing.jednostka === 'ml' ? 'ml' : 'g',
  }));

  return { flours, ingredients };
}

// ─── KONWERSJA ETAPÓW ─────────────────────────────────────────────
function buildStages(p) {
  const stages = [];
  const add = (name, czas, temp, opis) => {
    if (!opis) return;
    stages.push({
      name,
      duration:     Number(czas) || null,
      durationUnit: 'min',
      temp:         Number(temp) || null,
      description:  opis,
    });
  };

  add('Wyrabianie',
    p.wyrabianie?.czas_laczny_min,
    null,
    p.wyrabianie?.opis);

  add('Fermentacja',
    p.fermentacja?.czas_min,
    p.fermentacja?.temperatura_c,
    p.fermentacja?.opis);

  add('Wyrastanie wstępne',
    p.wyrastanie?.pierwsze?.czas_min,
    p.wyrastanie?.pierwsze?.temperatura_c,
    p.wyrastanie?.pierwsze?.opis);

  add(p.wyrastanie?.ostateczne?.w_lodowce ? 'Zimna fermentacja' : 'Garowanie',
    p.wyrastanie?.ostateczne?.czas_min,
    p.wyrastanie?.ostateczne?.temperatura_c,
    p.wyrastanie?.ostateczne?.opis);

  (p.pieczenie?.etapy || []).forEach((e, i) => {
    add(
      (p.pieczenie.etapy.length > 1) ? `Pieczenie — etap ${e.krok || i + 1}` : 'Pieczenie',
      e.czas_min,
      e.temperatura_c,
      e.opis
    );
  });

  return stages;
}

// ─── GŁÓWNA KONWERSJA ─────────────────────────────────────────────
function konwertuj(przepis, partia) {
  const { flours, ingredients } = gramyNaProcenty(przepis.skladniki || []);
  const stages                  = buildStages(przepis);

  const opis = [
    przepis.nazwa_oryginalna ? `🌍 ${przepis.nazwa_oryginalna}` : '',
    przepis.region           ? `📍 ${przepis.region}`           : '',
    przepis.trudnosc         ? `⚡ Trudność: ${przepis.trudnosc}` : '',
    przepis.waga_bochenka_g  ? `⚖️  Bochenek: ${przepis.waga_bochenka_g} g` : '',
    przepis.maka?.nawodnienie_procent ? `💧 Nawodnienie: ${przepis.maka.nawodnienie_procent}%` : '',
    (przepis.wskazowki?.length) ? '\n💡 Wskazówki:\n' + przepis.wskazowki.map(w => `• ${w}`).join('\n') : '',
  ].filter(Boolean).join('\n');

  return {
    name:        przepis.nazwa,
    category:    deriveCategory(przepis, partia),
    flours,
    ingredients,
    waterTemp:   przepis.fermentacja?.temperatura_c || 22,
    stages,
    description: opis,
    imageUrl:    przepis.imageUrl || DEFAULT_IMAGE,
    videoUrl:    '',
    ownerId:     'ADMIN',
    updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    // meta — oryginalne dane
    _zrodlo_id:  przepis.id,
    _region:     przepis.region,
    _kontynent:  przepis.kontynent,
    _trudnosc:   przepis.trudnosc,
    _tagi:       przepis.tagi || [],
    _partia:     partia,
  };
}

// ─── DODAJ BRAKUJĄCE KATEGORIE ────────────────────────────────────
const NOWE_KATEGORIE = [
  'Bułki i drożdżowe',
  'Chleby zdrowe',
  'Chleby świąteczne',
  'Pieczywo Świata',
];

async function zapewnijKategorie() {
  const snap = await db.collection('piekarz_categories').get();
  const istniejace = new Set(snap.docs.map(d => d.data().name));
  for (const kat of NOWE_KATEGORIE) {
    if (!istniejace.has(kat)) {
      await db.collection('piekarz_categories').add({ name: kat });
      console.log(`  ➕ Dodano kategorię: ${kat}`);
    }
  }
}

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
    console.error(`❌ Błąd JSON: ${e.message}`);
    return { ok: 0, err: 1 };
  }

  const przepisy = dane.przepisy || [];
  console.log(`\n📂 ${nazwaPliku}  →  ${przepisy.length} przepisów`);
  if (dryRun) console.log('   [DRY-RUN — nic nie jest zapisywane]\n');

  let ok = 0, err = 0;

  for (let i = 0; i < przepisy.length; i += 400) {
    const chunk = przepisy.slice(i, i + 400);
    const konwertowane = chunk.map(p => ({
      id:   p.id,
      data: konwertuj(p, nazwaPliku),
    }));

    if (dryRun) {
      konwertowane.forEach(({ id, data }) => {
        console.log(`   [DRY] ${id}  →  "${data.name}"  [${data.category}]`);
        console.log(`         flours: ${data.flours.map(f => `${f.name} ${f.percent}%`).join(', ')}`);
      });
      ok += chunk.length;
      continue;
    }

    const batch = db.batch();
    konwertowane.forEach(({ id, data }) => {
      batch.set(db.collection(COLLECTION).doc(id), data);
    });

    try {
      await batch.commit();
      ok += chunk.length;
      process.stdout.write(`   ✅ ${ok}/${przepisy.length} wgrano...\r`);
    } catch (e) {
      console.error(`\n   ❌ Batch error: ${e.message}`);
      err += chunk.length;
    }
  }

  console.log(`   ✅ Wynik: ${ok} wgrano, ${err} błędów           `);
  return { ok, err };
}

// ─── CLEANUP starej kolekcji ──────────────────────────────────────
async function cleanup() {
  console.log(`\n🗑️  Czyszczenie kolekcji: ${OLD_COLLECTION}...`);
  const snap = await db.collection(OLD_COLLECTION).get();
  if (snap.empty) { console.log('   Kolekcja już pusta.\n'); return; }

  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  console.log(`   ✅ Usunięto ${snap.docs.length} dokumentów z ${OLD_COLLECTION}\n`);
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  const args    = process.argv.slice(2);
  const dryRun  = args.includes('--dry-run');
  const all     = args.includes('--all');
  const doClean = args.includes('--cleanup');
  const partie  = args.filter(a => !a.startsWith('--'));

  if (args.length === 0) {
    console.log(`
Użycie:
  node import_partia.js --dry-run partia_01_polska
  node import_partia.js partia_01_polska
  node import_partia.js --all
  node import_partia.js --cleanup     (usuwa stare dane z piekarz_przepisy)
`);
    process.exit(0);
  }

  console.log(`
${'═'.repeat(58)}
  EBRA PIEKARZ — Import do Firestore
  Projekt:   ${PROJECT_ID}
  Kolekcja:  ${COLLECTION}
  Tryb:      ${dryRun ? '🔍 DRY-RUN' : '🚀 PRODUKCJA'}
${'═'.repeat(58)}`);

  if (doClean) {
    await cleanup();
    if (partie.length === 0 && !all) process.exit(0);
  }

  if (!dryRun) {
    console.log('\n📋 Sprawdzam kategorie Firestore...');
    await zapewnijKategorie();
  }

  let totalOk = 0, totalErr = 0;

  if (all) {
    const pliki = fs.readdirSync(PRZEPISY_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort();

    for (const plik of pliki) {
      const { ok, err } = await importPartia(plik, dryRun);
      totalOk  += ok;
      totalErr += err;
      if (!dryRun) await new Promise(r => setTimeout(r, 1500));
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
  Wgrano:  ${totalOk} przepisów → ${COLLECTION}
  Błędów:  ${totalErr}
${'═'.repeat(58)}
`);
  if (!dryRun && totalErr === 0)
    console.log(`  🔗 Sprawdź: https://console.firebase.google.com/project/${PROJECT_ID}/firestore\n`);

  process.exit(totalErr > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('\n❌', e.message);
  process.exit(1);
});
