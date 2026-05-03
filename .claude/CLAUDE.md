# Piekarski Master — instrukcja dla Claude Code

## Projekt

Kalkulator procentów piekarskich. React 18 SPA z Firebase Firestore i Stripe.  
Współdzieli Firebase project z Masarski Master (`masarski-pro-v2`), ale używa oddzielnych kolekcji `piekarz_*`.

- **Firebase project:** `masarski-pro-v2`
- **Hosting:** `piekarz.ebra.pl` (FTP deploy przez GitHub Actions)
- **Dev server:** `http://localhost:5173`

## Stack

- React 18.3 + Vite 5.4
- Tailwind CSS 3.4 (dark mode przez `data-theme="dark"` na `<html>`)
- Firebase 10.13 (Auth + Firestore, region: `europe-central2`)
- Stripe (payment links, nie Elements)
- vite-plugin-pwa 0.20 (PWA z autoUpdate)
- Tiptap 2.27 (rich text w recepturach)

## Struktura projektu

```
src/
  components/
    AdBanner.jsx        banery reklamowe z Firestore ads/
    AdminPanel.jsx      panel superadmina
    AuthModal.jsx       modal logowania (Google, Facebook, email)
    BottomNav.jsx       dolna nawigacja z 5 tabami
    Calculator.jsx      kalkulator procentów piekarskich — główna funkcja
    ClientPanel.jsx     panel użytkownika (profil, subskrypcja, receptury)
    Header.jsx          nagłówek z logo i theme toggle
    HomeScreen.jsx      landing page z kartą kalkulatora
    RecipeList.jsx      lista receptur z filtrowaniem po kategorii
    RecipeModal.jsx     modal dodawania/edycji receptury
    RichTextEditor.jsx  edytor HTML oparty na Tiptap
    SourdoughGuide.jsx  przewodnik zakwasów (unikat piekarski)
    SuccessPage.jsx     strona po opłaceniu Stripe
  hooks/
    useTheme.js         persystencja dark/light mode (klucz: ebra-theme)
  App.jsx               routing tabów + SAMPLE_RECIPES (demo bez konta)
  firebase.js           eksport: auth, db, SUPER_ROOT, MYDEVIL_URL
  stripe.js             eksport: STRIPE_LINKS
  main.jsx              entry point, PWA prompt, route /success
  index.css             CSS variables + Tailwind base
```

## Firestore — kolekcje

| Kolekcja | Opis |
|---|---|
| `piekarz_recipes/{id}` | receptury piekarskie |
| `piekarz_categories/{id}` | kategorie: Chleby pszenne, orkiszowe, żytnio-pszenne, Zakwasy |
| `piekarz_sourdough/{id}` | przewodniki zakwasów (tylko admin write) |
| `users/{uid}` | profile użytkowników (wspólne z masarski) |
| `ads/{id}` | banery reklamowe (wspólne) |
| `settings/pricing` | konfiguracja planów (wspólne) |

### Model receptury (`piekarz_recipes/{id}`)

```js
{
  name: string,
  category: string,
  flours: [{ name, percent, kg }],         // mąki jako % bazy
  ingredients: [{ name, percent, unit }],  // woda, sól, drożdże itp.
  waterTemp: number,                        // temperatura wody w °C
  stages: [{
    name: string,
    duration: number,
    durationUnit: 'min' | 'h',
    temp: number,
    description: string
  }],
  description: string,
  imageUrl: string,
  videoUrl: string,
  ownerId: string,          // uid lub 'ADMIN'
  updatedAt: Timestamp
}
```

### SAMPLE_RECIPES (App.jsx)

Demo receptury widoczne bez logowania, ownerId: `'ADMIN'`, id zaczyna się od `'__sample_'`.  
Nie są zapisane w Firestore — tylko w pamięci aplikacji.

## Różnice względem Masarski Master

| Cecha | Masarski | Piekarski |
|---|---|---|
| Kalkulator | wsad (g, kg) | procenty piekarskie |
| Kolekcja | `recipes` | `piekarz_recipes` |
| Accent color | `#0f0e0c` (dark) | `#c8860a` (amber) |
| PWA theme | `#0f0e0c` | `#c8860a` |
| Unikalny komponent | — | `SourdoughGuide.jsx` |
| Demo receptury | brak | SAMPLE_RECIPES w App.jsx |

## Zmienne środowiskowe

Plik `.env` (nie commitować):

```
VITE_STRIPE_LINK_MINI=
VITE_STRIPE_LINK_MIDI=
VITE_STRIPE_LINK_MAXI=
VITE_STRIPE_LINK_VIP=
```

Stripe payment links dla Piekarskiego nie są jeszcze skonfigurowane.

## Routing

Brak React Router. Ręczny routing w `main.jsx`:

```js
window.location.pathname === '/success'
  ? <SuccessPage />
  : <App />
```

## Theming

```css
/* Amber accent dla piekarstwa */
--accent: #c8860a;
```

Reszta CSS variables identyczna jak w masarski-claude.  
Przełączanie dark/light: `document.documentElement.setAttribute('data-theme', mode)`.

## Kalkulator piekarniczy — logika

Receptura piekarska opiera się na **procentach piekarskich**:
- Suma mąk = 100% (baza)
- Pozostałe składniki jako % od mąk
- Woda: np. 68% hydratacja = 680g wody na 1000g mąki

```
gram_składnika = (percent / 100) * łączna_masa_mąk
```

## Deploy

```bash
npm run build           # → dist/
firebase deploy --only firestore:rules   # z katalogu masarz-claude (wspólne rules)
```

FTP deploy do `piekarz.ebra.pl` przez `.github/workflows/deploy.yml` (trigger: push do main).

## Admin

Superadmin: `krzysiekgodek@gmail.com` (hardcoded w `firestore.rules`).  
`piekarz_sourdough` — tylko admin może pisać.

## Zasady kodowania

- Komponenty: JSX (nie TSX), bez PropTypes
- Styl: klasy Tailwind inline, amber accent (`#c8860a`) dla elementów marki
- Firestore: prefiks `piekarz_` we wszystkich kolekcjach specyficznych dla piekarni
- Nie używaj React Router — nawigacja przez `setActiveTab`
- Obrazy uploadować przez `MYDEVIL_URL` (piekarz.ebra.pl/upload_image.php)
- SAMPLE_RECIPES w App.jsx — to demo, nie Firestore; nie pomyl z prawdziwymi recepturami
