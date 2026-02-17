# Oprava 500 FUNCTION_INVOCATION_FAILED

## Co se změnilo v kódu

1. **API je teď v CommonJS** (`require` / `module.exports`) místo ESM (`import` / `export`), aby na Vercelu nedošlo k pádu při načítání modulů.
2. **vercel.json** – nastavený runtime Node 20 pro funkci.

## Co udělat ty

### 1. Zkopírovat nové soubory do repa

- Do repa zkopíruj **aktuální** verze:
  - **api/send-report.js** (z FA/api/send-report.js)
  - **vercel.json** (vlož do **kořene** repa – vedle package.json)
- V **kořeni** repa zkontroluj **package.json**:
  - **Neměl by** obsahovat `"type": "module"` (jinak by `require` v API nefungoval).  
  - Pokud tam je, řádek `"type": "module"` **smaž** a ulož.

### 2. Resend – ověřená doména

Posíláš z **diagnostika@marek-marek.cz**. V Resend.com musí být doména **marek-marek.cz** ověřená:

- Resend.com → **Domains** → **Add Domain** → **marek-marek.cz**
- Podle návodu přidej DNS záznamy (SPF, DKIM) u svého poskytovatele domény.
- Po ověření můžeš posílat z `diagnostika@marek-marek.cz`.

**Rychlý test bez ověření domény:**  
Dočasně v Vercelu změň env proměnnou **MAIL_FROM** na **onboarding@resend.dev** (Resend testovací adresa), ulož, udělej Redeploy a zkus znovu. Pokud to projde, chyba byla v neověřené doméně.

### 3. Commit, push, Redeploy

```bash
git add api/send-report.js vercel.json
git commit -m "API CommonJS + vercel.json Node 20"
git push
```

Na Vercelu případně: **Deployments** → **Redeploy**.

### 4. Když to pořád padá

Vercel → **Deployments** → vyber deployment → záložka **Logs**.  
Zkus znovu poslat report a v Logs zkontroluj **přesnou chybovou hlášku**. Ta říká, co se pokazilo (Resend, Supabase, parsování body, atd.).
