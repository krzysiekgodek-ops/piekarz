# /build — Build Piekarski Master

Buduje produkcyjną wersję aplikacji piekarskiej.

## Komendy

```bash
# Build produkcyjny
npm run build

# Podgląd buildu lokalnie
npm run preview

# Dev server z hot-reload
npm run dev
```

## Co sprawdzić po buildzie

1. Czy `dist/` zawiera pliki?
2. Czy `dist/manifest.webmanifest` ma `theme_color: "#c8860a"` (amber)?
3. Czy PWA name to "Piekarski Master"?

## Zmienne środowiskowe

Plik `.env` — Stripe links dla piekarskiego **nie są jeszcze skonfigurowane**.  
Przed produkcyjnym deployem uzupełnij:

```
VITE_STRIPE_LINK_MINI=https://buy.stripe.com/...
VITE_STRIPE_LINK_MIDI=https://buy.stripe.com/...
VITE_STRIPE_LINK_MAXI=https://buy.stripe.com/...
VITE_STRIPE_LINK_VIP=https://buy.stripe.com/...
```

## Różnice względem masarski

- PWA `theme_color: "#c8860a"` (amber zamiast dark brown)
- `manifest.name: "Piekarski Master"`
- `manifest.short_name: "Piekarz"`

## Troubleshooting

**Błąd importu:**
```bash
rm -rf node_modules && npm install && npm run build
```
