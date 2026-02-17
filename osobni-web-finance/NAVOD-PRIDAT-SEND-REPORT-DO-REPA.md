# Přidání /api/send-report do repa (máš v /api jen index.html)

V repozitáři máš teď v složce **api** jen **index.html**. Aby fungoval endpoint pro odeslání reportu e-mailem, přidej do **téže složky api** soubor **send-report.js**.

---

## 1. Přidat soubor do repa

### Varianta A: Repo máš lokálně (Cursor / VS Code)

1. Otevři **tu složku**, která je tvůj git repozitář (ta, ze které pushuješ na `osobni-web-finance`).
2. V ní otevři složku **api** (ta, kde máš teď jen `index.html`).
3. Do složky **api** přidej nový soubor s názvem přesně: **`send-report.js`**.
4. Zkopíruj do něj **celý obsah** ze souboru  
   `FA/api/send-report.js`  
   (v tomto projektu je v Desktop → Nový web → FA → api → send-report.js).
5. V **kořeni** repa (ne v api/) zkontroluj, že máš soubor **package.json**.  
   - Pokud **nemáš** package.json v kořeni: vytvoř ho v kořeni repa s obsahem:

```json
{
  "name": "osobni-web-finance",
  "private": true,
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "resend": "^3"
  }
}
```

6. V terminálu (v kořeni repa):

```bash
git add api/send-report.js
git add package.json
git commit -m "Přidání API send-report pro e-maily z diagnostiky"
git push
```

### Varianta B: Přidáš soubor přes GitHub

1. Na **github.com** otevři repozitář **osobni-web-finance**.
2. Otevři složku **api** (kde máš index.html).
3. Klikni **Add file** → **Create new file**.
4. Jméno souboru: **`send-report.js`**.
5. Obsah vlož z tohoto projektu: **FA/api/send-report.js** (celý soubor).
6. **Commit new file**.
7. V **kořeni** repa zkontroluj, jestli existuje **package.json**.  
   - Pokud ne: v kořeni repa **Add file** → **Create new file** → název **package.json**, obsah jako výše (včetně `"type": "module"` a závislostí). Commit.

---

## 2. Po pushi

- Vercel by měl sám spustit nový deploy.
- Nebo: Vercel → Deployments → u posledního deploye → **Redeploy**.

---

## 3. Ověření

Otevři v prohlížeči:

**https://osobni-web-finance.vercel.app/api/send-report**

- **405 Method Not Allowed** = route funguje, 404 je pryč.
- **404** = soubor ještě není v repu nebo deploy se nespustil – zkontroluj, že v repu v složce **api** opravdu je **send-report.js** a v kořeni **package.json**.

---

## Shrnutí

| Kde v repu | Co tam musí být |
|------------|------------------|
| **api/**   | `index.html` (máš) + **`send-report.js`** (přidej) |
| **kořen**  | **package.json** s `"type": "module"` a závislostmi `resend`, `@supabase/supabase-js` |

Soubor **send-report.js** máš připravený v tomto projektu v **FA/api/send-report.js** – stačí ho zkopírovat do složky **api** ve svém repozitáři.
