# /deploy — Deploy Piekarski Master

Wykonuje pełny deploy projektu na produkcję.

## Kroki

1. Sprawdź czy wszystko jest gotowe:

```bash
git status
git diff --stat
```

2. Zbuduj produkcyjną wersję:

```bash
npm run build
```

3. Jeśli zmieniałeś Firestore rules — deploy z `masarz-claude/` (rules są wspólne):

```bash
cd ../masarz-claude
firebase deploy --only firestore:rules --project masarski-pro-v2
cd ../piekarz-claude
```

4. Push do GitHub (triggery GitHub Actions → FTP deploy do piekarz.ebra.pl):

```bash
git add -A
git commit -m "deploy: [OPISZ ZMIANY]"
git push origin main
```

5. Sprawdź status deployu w Actions na GitHub.

## Ważne

- Firestore rules są **wspólne** — zmieniaj je tylko w `masarz-claude/firestore.rules`
- Firebase project: `masarski-pro-v2` (ten sam co masarski)
- FTP cel: `domains/piekarz.ebra.pl/public_html/`

## Rollback

```bash
git revert HEAD
git push origin main
```
