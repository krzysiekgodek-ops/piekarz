# Piekarski Master — README projektu
*Kalkulator rzemieślniczy EBRA dla piekarzy-hobbystów*
*Wersja: 1.0 | Data: 2026-04*

---

## 🎯 Cel projektu

Kalkulator receptur piekarskich dla hobbystów, działający na zasadzie **procentów piekarskich** (baker's percentage). Baza = 100% mąki = 1 kg. Umożliwia przeliczanie składników proporcjonalnie do zadanej ilości mąki.

---

## 🏗️ Stack technologiczny

Identyczny jak Masarski Master:

```
Frontend:  React + Vite + Tailwind CSS
Backend:   Firebase (Auth + Firestore)
Hosting:   MyDevil.net → piekarz.ebra.pl
CI/CD:     GitHub Actions → FTP deploy
Płatności: Stripe (Payment Links)
IDE:       VS Code + Claude Code
React + Vite + Tailwind CSS + Firebase (masarski-pro-v2)

```

---

## 🎨 Design System — EBRA Unified UI

Na podstawie pliku `ebra-ui.css` i `template.html`:

```css
/* Kolory bazowe EBRA */
--ebra-bg:        #0f0e0c    /* tło aplikacji */
--ebra-bg-card:   #161410    /* tło kart */
--ebra-bg-input:  #1c1a16    /* tło inputów */
--ebra-gold:      #c9a227    /* złoty EBRA */
--ebra-text-main: #f0ebe0    /* tekst główny */
--ebra-text-dim:  #a09a8e    /* tekst drugorzędny */
--ebra-border:    rgba(255,255,255,0.07)

/* AKCENT Piekarskiego Mastera */
--ebra-accent:      #c8860a  /* ciepły amber/pszenica */
--ebra-accent-glow: rgba(200, 134, 10, 0.15)


```
## Domena
piekarz.ebra.pl


**Czcionki (Google Fonts):**
- `Playfair Display` — nagłówki, tytuły (serif, elegancki)
- `Inter` — treść, etykiety, dane (sans-serif, czytelny)

**Ikona kalkulatora:** 🍞 lub własne SVG

---
## Logika kalkulatora
- Procenty piekarskie (mąka = 100% = baza)
- Kilka rodzajów mąki (suma = 100%)
- Składniki w % od mąki (woda, sól, drożdże itp.)
- Temperatura wody
- Etapy produkcji z czasem i temperaturą
- Osobna sekcja Zakwasy

## 📐 Logika kalkulatora — Procenty Piekarskie

### Zasada fundamentalna:
```
MĄKA = 100% (baza)
Wszystkie pozostałe składniki wyrażone są jako % mąki

Przykład dla 1 kg mąki:
- Mąka:    1000g = 100%
- Woda:     700g =  70% (hydracja)
- Sól:       20g =   2%
- Drożdże:   10g =   1%
```

### Przeliczanie:
```
Użytkownik podaje: ilość mąki w kg (np. 2 kg)
Kalkulator zwraca: wszystkie składniki w gramach

Wzór: składnik_g = (procent / 100) × masa_mąki_g
```

### Różne rodzaje mąki:
```
Receptura może zawierać kilka rodzajów mąki:
- Mąka pszenna T550:  70% (700g)
- Mąka żytnia T720:   30% (300g)
- SUMA:              100% (1000g) ← baza

Każdy rodzaj mąki ma osobny wiersz z procentem.
Suma wszystkich mąk = zawsze 100%.
```
## Kolekcje Firestore
- piekarz_recipes
- piekarz_categories  
- piekarz_sourdough
---

## 🗄️ Model danych Firestore

### Kolekcja: `piekarz_categories`
```json
{
  "id": "auto",
  "name": "Chleby pszenne",
  "createdAt": "timestamp",
  "createdBy": "admin_uid"
}
```

**Kategorie startowe (dodane przez admina):**
- Chleby orkiszowe
- Chleby pszenne
- Chleby żytnio-pszenne
- Zakwasy ← osobna kategoria

### Kolekcja: `piekarz_recipes`
```json
{
  "id": "auto",
  "name": "Chleb pszenny na drożdżach",
  "category": "Chleby pszenne",
  "ownerId": "ADMIN" | "user_uid",
  "isAdmin": true | false,
  "blocked": false,

  "flours": [
    { "name": "Mąka pszenna T550", "percent": 100 }
  ],

  "ingredients": [
    { "name": "Woda",     "percent": 70,  "unit": "g" },
    { "name": "Sól",      "percent": 2,   "unit": "g" },
    { "name": "Drożdże",  "percent": 1,   "unit": "g" }
  ],

  "waterTemp": 28,

  "stages": [
    {
      "name": "Wyrabianie ciasta",
      "duration": 15,
      "durationUnit": "min",
      "temp": null,
      "description": "Wyrabiaj do gładkości"
    },
    {
      "name": "Pierwsze wyrastanie",
      "duration": 60,
      "durationUnit": "min",
      "temp": 24,
      "description": "Przykryj ściereczką"
    },
    {
      "name": "Pieczenie",
      "duration": 35,
      "durationUnit": "min",
      "temp": 230,
      "description": "Z parą przez pierwsze 15 min"
    }
  ],

  "description": "Pełna procedura produkcji...",
  "imageUrl": "https://...",
  "videoUrl": "https://youtube.com/...",
  "createdAt": "timestamp",
  "favorites": []
}
```

### Kolekcja: `piekarz_sourdough` (Zakwasy)
```json
{
  "id": "auto",
  "name": "Zakwas żytni",
  "flourType": "Mąka żytnia T720",
  "hydration": 100,
  "feedingRatio": "1:1:1",
  "feedingSchedule": "Co 24h",
  "stages": [
    {
      "day": 1,
      "description": "Wymieszaj 50g mąki z 50g wody...",
      "temp": 25
    }
  ],
  "description": "Pełna instrukcja hodowania zakwasu",
  "imageUrl": "https://..."
}
```

---

## 📱 Nawigacja (Bottom Nav) — 4 ikony

```
🏠 Home      → lista kalkulatorów EBRA (link do ebra.pl)
📖 Receptury → receptury admina, publiczne
❤️ Moje      → receptury użytkownika + ulubione
👤 Konto     → subskrypcja, profil, plany
```

---

## Plany subskrypcji (wspólne )
- free: 2 receptury
- mini: 10 receptur / 12 zł / rok / 1 kalkulator
- midi: 20 receptur / 20 zł / rok / 1 kalkulator
- maxi: 30 receptur / 30 zł / rok / 1 kalkulator
- vip: 100 receptur łącznie / 60 zł / rok / wszystkie kalkulatory


---

## 🧮 Funkcje kalkulatora

### 1. Wybór receptury
```
Kategoria (dropdown) → Receptura (dropdown) → Podaj ilość mąki [kg]
```

### 2. Wynik kalkulacji
```
Dla każdego składnika wyświetl:
- Nazwa składnika
- Procent (%)
- Ilość w gramach (g)

Temperatura wody: X°C
```

### 3. Etapy produkcji
```
Krok 1: [Nazwa] — [Czas] — [Temperatura] — [Opis]
Krok 2: ...
```

### 4. Sekcja Zakwas
```
Osobna zakładka/kategoria z:
- Instrukcja tworzenia zakwasu od zera
- Harmonogram dokarmiania
- Proporcje dokarmiania
- Zdjęcia etapów
```

---

## 🔧 Panel Admina

### Dodawanie kategorii:
```
+ Dodaj kategorię → nazwa → zapisz do Firestore
```

### Dodawanie receptury:
```
1. Wybierz kategorię
2. Nazwa receptury
3. Dodaj rodzaje mąki z procentami (suma = 100%)
4. Dodaj składniki (woda, sól, drożdże itp.) w %
5. Temperatura wody
6. Dodaj etapy produkcji:
   - Nazwa etapu
   - Czas (min/h)
   - Temperatura (°C) — opcjonalna
   - Opis
7. Dodaj opis tekstowy
8. Wgraj zdjęcie
9. Link do YouTube (opcjonalnie)
```

### Moderacja:
```
- Podgląd receptur użytkowników
- Blokowanie/odblokowanie
- Oznaczanie jako "zweryfikowana"
```

---

## 📁 Struktura projektu

```
D:\portal_ebra\piekarz-claude\
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── firebase.js
│   ├── stripe.js
│   ├── index.css         ← import czcionek EBRA
│   └── components/
│       ├── Header.jsx        ← logo EBRA + link ebra.pl
│       ├── BottomNav.jsx     ← 4 ikony nawigacji
│       ├── HomeScreen.jsx    ← lista kalkulatorów
│       ├── RecipeList.jsx    ← receptury + zakwasy
│       ├── Calculator.jsx    ← kalkulator piekarskich %
│       ├── SourdoughGuide.jsx← przewodnik zakwasu
│       ├── RecipeModal.jsx   ← dodawanie receptury
│       ├── AuthModal.jsx     ← logowanie
│       ├── AdminPanel.jsx    ← panel admina
│       ├── ClientPanel.jsx   ← panel + Stripe
│       └── SuccessPage.jsx
├── public/
│   ├── piekarz-banner.jpg    ← baner na HomeScreen
│   ├── logo-ebra.svg
│   ├── upload_image.php
│   └── icons/
├── .github/workflows/
│   └── deploy.yml            ← auto deploy na MyDevil
├── firestore.rules
├── firebase.json
├── .env
└── CLAUDE.md
```

---

## 🚀 Konfiguracja do ustalenia

```
⬜ Firebase projekt (nowy lub współdzielony z masarzem?)
⬜ Domena piekarz.ebra.pl → skierować na MyDevil
⬜ Nowe konto FTP dla piekarz.ebra.pl
⬜ GitHub repo (nowe: piekarz)
⬜ Stripe — nowe plany subskrypcji dla piekarza
⬜ GitHub Secrets (FTP + Stripe)
```

---

## 📋 Prompt startowy dla Claude Code

```
Zbuduj aplikację React + Vite + Tailwind dla kalkulatora 
"Piekarski Master" zgodnie z README_PIEKARZ.md.

Design System: EBRA Unified UI
- tło: #0f0e0c
- akcent: #c8860a (amber/pszenica)
- czcionki: Playfair Display + Inter
- komponenty: identyczne jak masarz-claude

Logika kalkulatora:
- Procenty piekarskie (mąka = 100% = baza)
- Kilka rodzajów mąki z procentami (suma = 100%)
- Składniki w % od mąki
- Temperatura wody
- Etapy produkcji z czasem i temperaturą
- Osobna sekcja Zakwasy

Firebase kolekcje:
- piekarz_categories
- piekarz_recipes  
- piekarz_sourdough
```
## Kategorie startowe
- Chleby orkiszowe
- Chleby pszenne
- Chleby żytnio-pszenne
- Zakwasy

## Design System EBRA
- tło: #0f0e0c
- karty: #161410
- tekst: #f0ebe0
- akcent: #c8860a
- czcionki: Playfair Display + Inter
---

*README przygotowane na podstawie projektu Masarski Master i systemu EBRA Unified Design System*
