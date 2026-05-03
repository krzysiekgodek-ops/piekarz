# /test — Test Piekarski Master

Manualna lista testów do wykonania przed deployem.

## Testy funkcjonalne (manualne)

### 1. Autoryzacja

- [ ] Logowanie przez Google działa
- [ ] Logowanie przez Facebook działa
- [ ] Logowanie przez email/hasło działa
- [ ] Wylogowanie działa

### 2. Receptury piekarskie

- [ ] Lista receptur (`piekarz_recipes`) ładuje się
- [ ] SAMPLE_RECIPES są widoczne bez logowania
- [ ] Dodanie nowej receptury z polami: mąki, składniki, etapy
- [ ] Edycja własnej receptury
- [ ] Filtrowanie po kategorii (Chleby pszenne, orkiszowe, żytnio-pszenne, Zakwasy)
- [ ] Limit receptur blokuje po przekroczeniu planu

### 3. Kalkulator piekarniczy

- [ ] Kalkulator się otwiera
- [ ] Zmiana masy mąki przelicza składniki przez procenty piekarskie
- [ ] Hydratacja obliczana poprawnie (np. 68% = 680g wody na 1000g mąki)
- [ ] Temperatura wody wyświetla się poprawnie

### 4. Przewodnik zakwasów (SourdoughGuide)

- [ ] Zakładka zakwasów się otwiera
- [ ] Treść z `piekarz_sourdough` się wyświetla
- [ ] Admin może dodawać/edytować przewodniki

### 5. Konto i plany

- [ ] Profil użytkownika pokazuje poprawny plan
- [ ] Linki Stripe (gdy skonfigurowane) kierują poprawnie

### 6. PWA

- [ ] Aplikacja działa offline
- [ ] Theme color w przeglądarce to amber `#c8860a`

### 7. Dark mode

- [ ] Przełącznik theme działa
- [ ] Amber accent color jest widoczny w UI

## Specyficzne testy piekarskie

Sprawdź poprawność kalkulatora:
- Receptura: 1000g mąki, 68% hydratacja, 2% sól, 1% drożdże
- Oczekiwany wynik: woda=680g, sól=20g, drożdże=10g
