# Piekarski Master — CLAUDE.md

## Stack
React 18 + Vite 5 + Tailwind CSS 3 + Firebase (masarski-pro-v2)

## Akcent kolorystyczny
`#c8860a` — amber/pszenica (zamiast czerwonego z masarz-claude)

## Firebase kolekcje
- `piekarz_recipes` — receptury piekarskie
- `piekarz_categories` — kategorie (Chleby pszenne, Chleby orkiszowe, Chleby żytnio-pszenne, Zakwasy)
- `piekarz_sourdough` — przewodniki zakwasów
- `users`, `ads`, `settings` — współdzielone z masarz-claude

## Logika kalkulatora
Procenty piekarskie: mąka = 100% (baza)
`składnik_g = (percent / 100) × flour_kg × 1000`

## Deploy
GitHub Actions → SSH → domains/piekarz.ebra.pl/public_html/
Secrets: SSH_HOST, SSH_USER, SSH_PRIVATE_KEY, VITE_STRIPE_LINK_*

## Kategorie startowe (do dodania w Firestore przez admina)
- Chleby orkiszowe
- Chleby pszenne
- Chleby żytnio-pszenne
- Zakwasy
