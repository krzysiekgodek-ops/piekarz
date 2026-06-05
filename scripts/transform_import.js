#!/usr/bin/env node
/**
 * EBRA Piekarz — Transformacja i import do piekarz_recipes
 * Mapuje schemat JSON (polski) → schemat kalkulatora aplikacji
 *
 * Użycie:
 *   node transform_import.js --dry-run partia_01_polska
 *   node transform_import.js partia_01_polska
 *   node transform_import.js --all
 *   node transform_import.js --clean-przepisy    (usuwa stare wpisy z piekarz_przepisy)
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// ─── KONFIGURACJA ─────────────────────────────────────────────────
const PROJECT_ID    = 'masarski-pro-v2';
const COLLECTION    = 'piekarz_recipes';       // kolekcja kalkulatora
const OLD_COLL      = 'piekarz_przepisy';      // stara kolekcja do wyczyszczenia
const CATEGORIES_COLL = 'piekarz_categories';
const PRZEPISY_DIR  = path.join(__dirname, '..', 'przepisy');
const SERVICE_KEY   = path.join(__dirname, 'serviceAccountKey.json');
const DEFAULT_IMAGE = 'https://piekarz.ebra.pl/wzorzec.jpg';
const OWNER_ID      = 'ADMIN';
// ──────────────────────────────────────────────────────────────────

// ─── MAPOWANIE KATEGORII ─────────────────────────────────────────
// Kategorie na podstawie nazwy partii i podtypu przepisu
const PARTIA_CATEGORY = {
  'partia_02_europa_zachodnia': 'Chleby świata',
  'partia_03_europa_wschodnia': 'Chleby świata',
  'partia_04_srodziemnomorze':  'Chleby świata',
  'partia_05_ameryki':          'Chleby świata',
  'partia_06_azja':             'Chleby świata',
  'partia_07_afryka':           'Chleby świata',
  'partia_08_bulki_i_drozdzowe': 'Bułki i drożdżowe',
  'partia_09_zdrowe_dietetyczne': 'Zdrowe i dietetyczne',
  'partia_10_swiateczne':        'Świąteczne i obrzędowe',
};

// Nowe kategorie do dodania do Firestore
const NOWE_KATEGORIE = [
  'Chleby polskie',
  'Chleby świata',
  'Bułki i drożdżowe',
  'Zdrowe i dietetyczne',
  'Świąteczne i obrzędowe',
];

function mapCategory(przepis, partia) {
  // Dla partii 01 (polska) — szczegółowy podział
  if (partia === 'partia_01_polska') {
    const p = przepis.podtyp || '';
    if (p.includes('orkisz')) return 'Chleby orkiszowe';
    if (p.includes('żytni_pszenny') || p.includes('pszenno_żytni') || p.includes('mieszany')) return 'Chleby żytnio-pszenne';
    if (p.includes('żytni')) return 'Chleby żytnio-pszenne';
    if (p.includes('pszenny') || przepis.typ === 'bułki') return 'Chleby pszenne';
    return 'Chleby polskie';
  }
  // Dla pozostałych — na podstawie partii
  return PARTIA_CATEGORY[partia] || 'Chleby świata';
}

// ─── WYKRYWANIE MĄKI ─────────────────────────────────────────────
const FLOUR_KEYWORDS = [
  'mąka', 'semolina', 'atta', 'masa harina', 'polvilho', 'maida',
  'teff', 'sorgho', 'kasza', 'masarepa', 'śruta', 'płatki owsiane',
  'skrobia', 'mąka ryżowa', 'mąka kokosowa', 'mąka migdałowa',
  'mąka gryczana', 'mąka jaglana', 'mąka kukurydziana', 'żyto łamane',
  'fasola', 'mąka z tapioki', 'mąka sorgo',
];

function isFlour(name) {
  const n = name.toLowerCase();
  return FLOUR_KEYWORDS.some(k => n.includes(k));
}

// ─── MAPOWANIE SKŁADNIKÓW ─────────────────────────────────────────
function mapFlours(skladniki) {
  const flourItems = skladniki.filter(s => isFlour(s.nazwa));
  if (flourItems.length === 0) {
    // Fallback: traktuj pierwszy składnik jako mąkę
    flourItems.push(skladniki[0]);
  }
  const totalFlourG = flourItems.reduce((sum, s) => sum + (s.ilosc || 0), 0);

  return flourItems.map(s => ({
    name:    s.nazwa,
    percent: totalFlourG > 0 ? Math.round((s.ilosc / totalFlourG) * 100) : 100,
  }));
}

function mapIngredients(skladniki) {
  const flourItems = skladniki.filter(s => isFlour(s.nazwa));
  const totalFlourG = flourItems.reduce((sum, s) => sum + (s.ilosc || 0), 0) || 500;

  return skladniki
    .filter(s => !isFlour(s.nazwa))
    .map(s => ({
      name:    s.nazwa,
      percent: Math.round((s.ilosc / totalFlourG) * 100),
      unit:    s.jednostka || 'g',
    }));
}

// ─── MAPOWANIE ETAPÓW ─────────────────────────────────────────────
function toStageTime(czas_min, czas_max) {
  const avg = Math.round(((czas_min || 0) + (czas_max || czas_min || 0)) / 2);
  if (avg === 0) return null;
  if (avg >= 120) return { duration: Math.round(avg / 60), durationUnit: 'h' };
  return { duration: avg, durationUnit: 'min' };
}

function mapStages(przepis) {
  const stages = [];

  // 1. Wyrabianie
  if (przepis.wyrabianie && przepis.wyrabianie.czas_laczny_min > 0) {
    stages.push({
      name:         'Wyrabianie',
      duration:     przepis.wyrabianie.czas_laczny_min,
      durationUnit: 'min',
      temp:         null,
      description:  przepis.wyrabianie.opis || `Metoda: ${przepis.wyrabianie.metoda || ''}`,
    });
  }

  // 2. Fermentacja
  if (przepis.fermentacja) {
    const t = toStageTime(przepis.fermentacja.czas_min, przepis.fermentacja.czas_max);
    if (t) {
      const typ = przepis.fermentacja.typ || '';
      stages.push({
        name:         typ === 'zakwas' ? 'Fermentacja zakwasowa'
                    : typ === 'chemiczna_soda' || typ === 'brak' ? null
                    : 'Fermentacja',
        duration:     t.duration,
        durationUnit: t.durationUnit,
        temp:         przepis.fermentacja.temperatura_c || null,
        description:  przepis.fermentacja.opis || '',
      });
    }
  }

  // 3. Wyrastanie wstępne
  const w1 = przepis.wyrastanie?.pierwsze;
  if (w1 && w1.czas_min > 0) {
    const t = toStageTime(w1.czas_min, w1.czas_max);
    if (t) {
      stages.push({
        name:         'Wyrastanie wstępne',
        duration:     t.duration,
        durationUnit: t.durationUnit,
        temp:         w1.temperatura_c || null,
        description:  w1.opis || '',
      });
    }
  }

  // 4. Garowanie / zimna fermentacja
  const w2 = przepis.wyrastanie?.ostateczne;
  if (w2 && w2.czas_min > 0) {
    const t = toStageTime(w2.czas_min, w2.czas_max);
    if (t) {
      stages.push({
        name:         w2.w_lodowce ? 'Zimna fermentacja (lodówka)' : 'Garowanie',
        duration:     t.duration,
        durationUnit: t.durationUnit,
        temp:         w2.temperatura_c || null,
        description:  w2.opis || '',
      });
    }
  }

  // 5. Pieczenie
  if (przepis.pieczenie && przepis.pieczenie.czas_calkowity_min > 0) {
    const p = przepis.pieczenie;
    const opisEtapow = (p.etapy || []).map(e => e.opis).join(' → ');
    stages.push({
      name:         'Pieczenie',
      duration:     p.czas_calkowity_min,
      durationUnit: 'min',
      temp:         p.temperatura_wstepna_c || 200,
      description:  [p.naczynie, opisEtapow].filter(Boolean).join('. '),
    });
  }

  // Usuń etapy z name === null
  return stages.filter(s => s.name !== null);
}

// ─── OPIS ─────────────────────────────────────────────────────────
function mapDescription(przepis) {
  const parts = [];
  if (przepis.region) parts.push(`🌍 ${przepis.region}`);
  if (przepis.trudnosc) parts.push(`⭐ Trudność: ${przepis.trudnosc}`);
  if (przepis.waga_bochenka_g) parts.push(`⚖️ Waga bochenka: ${przepis.waga_bochenka_g} g`);
  if (przepis.maka?.nawodnienie_procent) parts.push(`💧 Hydratacja: ${przepis.maka.nawodnienie_procent}%`);
  if (przepis.wskazowki?.length) {
    parts.push('');
    parts.push('💡 Wskazówki:');
    przepis.wskazowki.forEach(w => parts.push(`• ${w}`));
  }
  return parts.join('\n');
}

// ─── GŁÓWNA TRANSFORMACJA ─────────────────────────────────────────
function transform(przepis, partia) {
  return {
    name:        przepis.nazwa,
    category:    mapCategory(przepis, partia),
    flours:      mapFlours(przepis.skladniki || []),
    ingredients: mapIngredients(przepis.skladniki || []),
    waterTemp:   przepis.fermentacja?.temperatura_c || 22,
    stages:      mapStages(przepis),
    description: mapDescription(przepis),
    imageUrl:    przepis.imageUrl || DEFAULT_IMAGE,
    videoUrl:    '',
    ownerId:     OWNER_ID,
    updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    // Dodatkowe pola dla wyszukiwania
    _region:     przepis.region || '',
    _kontynent:  przepis.kontynent || '',
    _trudnosc:   przepis.trudnosc || '',
    _tagi:       przepis.tagi || [],
    _podtyp:     przepis.podtyp || '',
    _partia:     partia,
    _orygId:     przepis.id,
  };
}

// ─── FIREBASE ─────────────────────────────────────────────────────
if (!fs.existsSync(SERVICE_KEY)) {
  console.error(`\n❌ Brak serviceAccountKey.json w: ${SERVICE_KEY}\n`);
  process.exit(1);
}

admin.initializeApp({
  credential:  admin.credential.cert(require(SERVICE_KEY)),
  projectId:   PROJECT_ID,
});
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ─── DODAJ KATEGORIE DO FIRESTORE ─────────────────────────────────
async function ensureCategories(dryRun) {
  const snap = await db.collection(CATEGORIES_COLL).get();
  const existing = new Set(snap.docs.map(d => d.data().name));
  const batch = db.batch();
  let added = 0;

  NOWE_KATEGORIE.forEach(name => {
    if (!existing.has(name)) {
      const ref = db.collection(CATEGORIES_COLL).doc();
      if (!dryRun) batch.set(ref, { name });
      console.log(`  ${dryRun ? '[DRY]' : '+'} Kategoria: ${name}`);
      added++;
    }
  });

  if (!dryRun && added > 0) await batch.commit();
  if (added === 0) console.log('  ✅ Kategorie już istnieją');
}

// ─── IMPORT PARTII ────────────────────────────────────────────────
async function importPartia(nazwaPliku, dryRun = false) {
  const plikPath = path.join(PRZEPISY_DIR, `${nazwaPliku}.json`);
  if (!fs.existsSync(plikPath)) {
    console.error(`❌ Brak pliku: ${plikPath}`);
    return { ok: 0, err: 1 };
  }

  const dane    = JSON.parse(fs.readFileSync(plikPath, 'utf-8'));
  const przepisy = dane.przepisy || [];

  console.log(`\n📂 ${nazwaPliku}  →  ${przepisy.length} przepisów → ${COLLECTION}`);

  let ok = 0, err = 0;
  const BATCH_SIZE = 400;

  for (let i = 0; i < przepisy.length; i += BATCH_SIZE) {
    const chunk = przepisy.slice(i, i + BATCH_SIZE);

    if (dryRun) {
      chunk.forEach(p => {
        const mapped = transform(p, nazwaPliku);
        console.log(`  [DRY] ${mapped.ownerId}/${p.id}  "${mapped.name}"  [${mapped.category}]`);
      });
      ok += chunk.length;
      continue;
    }

    const batch = db.batch();
    chunk.forEach(p => {
      // Użyj oryginalnego ID z JSON jako ID dokumentu
      const docRef = db.collection(COLLECTION).doc(p.id);
      batch.set(docRef, transform(p, nazwaPliku));
    });

    try {
      await batch.commit();
      ok += chunk.length;
      process.stdout.write(`  ✅ Zapisano ${ok}/${przepisy.length}...\r`);
    } catch (e) {
      console.error(`\n  ❌ Błąd: ${e.message}`);
      err += chunk.length;
    }
  }

  console.log(`  Wynik: ✅ ${ok} wgrano  ❌ ${err} błędów           `);
  return { ok, err };
}

// ─── USUŃ STARE DOKUMENTY Z piekarz_przepisy ──────────────────────
async function cleanPrzepisy() {
  console.log(`\n🗑  Usuwanie dokumentów z kolekcji ${OLD_COLL}...`);
  const snap = await db.collection(OLD_COLL).get();
  if (snap.empty) { console.log('   Kolekcja już pusta.'); return; }

  const BATCH_SIZE = 400;
  let deleted = 0;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i, i + BATCH_SIZE).forEach(d => batch.delete(d.ref));
    await batch.commit();
    deleted += Math.min(BATCH_SIZE, docs.length - i);
    process.stdout.write(`   Usunięto ${deleted}/${docs.length}...\r`);
  }
  console.log(`   ✅ Usunięto ${deleted} dokumentów z ${OLD_COLL}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  const args   = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const all    = args.includes('--all');
  const clean  = args.includes('--clean-przepisy');
  const partie = args.filter(a => !a.startsWith('--'));

  if (args.length === 0) {
    console.log(`
Użycie:
  node transform_import.js --dry-run partia_01_polska
  node transform_import.js partia_01_polska
  node transform_import.js --all
  node transform_import.js --clean-przepisy   (czyści starą kolekcję piekarz_przepisy)
`);
    process.exit(0);
  }

  console.log(`\n${'═'.repeat(60)}
  EBRA Piekarz — Transform & Import do Firestore
  Kolekcja docelowa:  ${COLLECTION}
  Tryb:               ${dryRun ? '🔍 DRY-RUN' : '🚀 PRODUKCJA'}
${'═'.repeat(60)}`);

  // Wyczyść starą kolekcję
  if (clean) { await cleanPrzepisy(); return; }

  // Upewnij się że kategorie istnieją
  console.log('\n📁 Sprawdzanie kategorii w Firestore...');
  await ensureCategories(dryRun);

  let totalOk = 0, totalErr = 0;

  if (all) {
    const pliki = fs.readdirSync(PRZEPISY_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort();

    for (const plik of pliki) {
      const { ok, err } = await importPartia(plik, dryRun);
      totalOk += ok; totalErr += err;
      if (!dryRun) await new Promise(r => setTimeout(r, 1500));
    }
  } else {
    for (const partia of partie) {
      const { ok, err } = await importPartia(partia, dryRun);
      totalOk += ok; totalErr += err;
    }
  }

  console.log(`\n${'═'.repeat(60)}
  PODSUMOWANIE
  Wgrano:  ${totalOk} przepisów → ${COLLECTION}
  Błędów:  ${totalErr}
${'═'.repeat(60)}\n`);

  if (!dryRun && totalErr === 0)
    console.log(`  🔗 https://console.firebase.google.com/project/${PROJECT_ID}/firestore\n`);

  process.exit(totalErr > 0 ? 1 : 0);
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
