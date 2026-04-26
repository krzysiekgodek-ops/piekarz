Zbuduj kompletną aplikację "Piekarski Master" zgodnie z README\_PIEKARZ.md

który jest w tym folderze.



Skopiuj i dostosuj strukturę z D:\\portal\_ebra\\masarz-claude\\ —

zachowaj identyczny wygląd i architekturę ale zmień:



1\. Akcent kolorystyczny: #c8860a (amber) zamiast #DC2626 (czerwony)

2\. Nazwa: "Piekarski Master" zamiast "Masarski Master"

3\. Ikona: 🍞

4\. Firebase kolekcje: piekarz\_categories, piekarz\_recipes, piekarz\_sourdough

5\. Kalkulator: procenty piekarskie (mąka=100%) zamiast masarskiego



6\. Logika kalkulatora:

&#x20;  - użytkownik podaje ilość mąki w kg

&#x20;  - kilka rodzajów mąki z procentami (suma=100%)

&#x20;  - składniki (woda, sól, drożdże) w % od mąki

&#x20;  - temperatura wody

&#x20;  - etapy produkcji z czasem i temperaturą



7\. Dodaj komponent SourdoughGuide.jsx — zakwasy jako osobna kategoria



8\. CI/CD deploy.yml:

&#x20;  - SSH\_HOST: secrets.SSH\_HOST

&#x20;  - SSH\_USER: secrets.SSH\_USER

&#x20;  - SSH\_PRIVATE\_KEY: secrets.SSH\_PRIVATE\_KEY

&#x20;  - target: domains/piekarz.ebra.pl/public\_html/



9\. Skopiuj z masarz-claude:

&#x20;  - src/components/Header.jsx (tylko zmień akcent)

&#x20;  - src/components/AuthModal.jsx (bez zmian)

&#x20;  - src/components/BottomNav.jsx (tylko zmień akcent)

&#x20;  - src/components/HomeScreen.jsx (tylko zmień akcent)

&#x20;  - src/components/ClientPanel.jsx (tylko zmień akcent i nazwy planów)

&#x20;  - src/firebase.js (bez zmian — ten sam projekt Firebase)





