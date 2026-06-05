#!/usr/bin/env node
/**
 * EBRA Piekarz — Walidacja plików JSON z przepisami
 * Uruchom z: D:\DEV\EBRA\piekarz-claude\scripts\
 *   node validate.js
 */
const fs   = require('fs');
const path = require('path');

const DIR      = path.join(__dirname, '..', 'przepisy');
const WYMAGANE = ['id','nazwa','nazwa_oryginalna','region','kontynent','typ',
                  'skladniki','fermentacja','wyrastanie','pieczenie','tagi'];

if (!fs.existsSync(DIR)) {
  console.error(`❌ Brak katalogu: ${DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort();
let total = 0, totalErrors = 0;
const allIds = new Set();

console.log('\n' + '═'.repeat(60));
console.log('  EBRA PIEKARZ — Walidacja przepisów');
console.log('═'.repeat(60));

files.forEach(file => {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf-8'));
  } catch (e) {
    console.log(`❌ ${file}: BŁĄD JSON — ${e.message}`);
    totalErrors++;
    return;
  }

  const przepisy  = raw.przepisy || [];
  let fileErrors  = 0;

  przepisy.forEach((p, i) => {
    WYMAGANE.forEach(pole => {
      if (!p[pole] || (Array.isArray(p[pole]) && p[pole].length === 0)) {
        console.log(`  ❌ ${file} #${i+1} (${p.id}): brak '${pole}'`);
        fileErrors++; totalErrors++;
      }
    });
    if (allIds.has(p.id)) {
      console.log(`  ⚠️  Duplikat ID: ${p.id}`);
      fileErrors++; totalErrors++;
    }
    allIds.add(p.id);
  });

  console.log(`${fileErrors === 0 ? '✅' : '⚠️ '} ${file.padEnd(42)} ${przepisy.length} przepisów`);
  total += przepisy.length;
});

console.log('═'.repeat(60));
console.log(`  Pliki:        ${files.length}/10`);
console.log(`  Przepisy:     ${total}/200`);
console.log(`  Unikalne ID:  ${allIds.size}`);
console.log(`  Błędy:        ${totalErrors}`);
console.log('═'.repeat(60));
if (totalErrors === 0 && total === 200)
  console.log('  🎉 BAZA GOTOWA! 200 przepisów bez błędów.\n');
else
  console.log(`  ⚠️  ${totalErrors} błędów lub brakuje ${200-total} przepisów.\n`);
