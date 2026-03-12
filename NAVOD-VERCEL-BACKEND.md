# Návod: Dokončení backendu na Vercel (e-maily z diagnostiky)

Tvůj projekt je na Vercelu:
- **Doména:** https://osobni-web-finance.vercel.app  
- **Deployment:** osobni-web-finance-p68fe54dk-marekmarek-webs-projects.vercel.app  

Aby tlačítko **„Poslat výsledek na email“** v diagnostice poslalo PDF tobě i klientovi přes API, udělej následující kroky.

---

## 1. Resend.com (odesílání e-mailů)

1. Jdi na **https://resend.com** a založ účet (zdarma).
2. V dashboardu: **API Keys** → **Create API Key** → pojmenuj např. `vercel-diagnostika` → zkopíruj klíč (začíná `re_...`).
3. V **Domains** přidej doménu, ze které chceš posílat (např. `marek-marek.cz` nebo použij výchozí Resend doménu pro testy).
   - Pokud nechceš nastavovat vlastní doménu hned: Resend ti dá e-mail typu `onboarding@resend.dev` – ten můžeš použít jako **MAIL_FROM** jen pro testování (omezené množství).

---

## 2. Supabase Service Role Key

1. Otevři **Supabase** → tvůj projekt (URL máš v kódu: `bqevrmtonpbmbyvvynev`).
2. **Settings** (ikona ozubeného kolečka) → **API**.
3. V sekci **Project API keys** zkopíruj **`service_role`** (ne `anon`).  
   - Tento klíč smí být **pouze na backendu** (Vercel env), nikdy v prohlížeči.

---

## 3. Environment Variables na Vercelu

1. Přihlas se na **https://vercel.com** → vyber projekt (osobni-web-finance).
2. **Settings** → **Environment Variables**.
3. Přidej následující proměnné. Pro **Environment** zaškrtni **Production** (a případně Preview, pokud chceš testovat na preview deployi).

| Name | Value | Poznámka |
|------|--------|----------|
| `RESEND_API_KEY` | `re_xxxx...` | API klíč z Resend (krok 1) |
| `MAIL_FROM` | Např. `diagnostika@marek-marek.cz` nebo `onboarding@resend.dev` | Odesílatel – musí být ověřená doména v Resend (nebo Resend testovací) |
| `MAIL_TO_MAREK` | `kontakt@marek-marek.cz` | Kam přijde notifikace o novém leadovi |
| `SUPABASE_URL` | `https://bqevrmtonpbmbyvvynev.supabase.co` | Tvůj Supabase projekt URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (dlouhý JWT) | Service role key z Supabase (krok 2) |
| `CALENDLY_URL` | Např. `https://calendly.com/tvuj-link` | Odkaz na rezervaci 15 min callu |

Po uložení každé proměnné klikni **Save**.

---

## 4. Redeploy na Vercelu

- Environment variables se na běžící deployment aplikují až po novém deployi.
- V projektu: **Deployments** → u posledního deploye menu (tři tečky) → **Redeploy** (nebo pushni nový commit do repozitáře).

---

## 5. Ověření, že API běží

1. Po redeployi otevři v prohlížeči:
   - `https://osobni-web-finance.vercel.app/api/send-report`  
   - Měl bys dostat **405 Method Not Allowed** (protože jde o GET; API očekává POST). To znamená, že route existuje.
2. Diagnostika je nastavená tak, že při **„Poslat výsledek na email“** posílá request na:
   - `https://osobni-web-finance.vercel.app/api/send-report`  
   Pokud máš v kroku 1 vyplněný e-mail a vygenerované PDF, po kliknutí by měl přijít e-mail tobě (MAIL_TO_MAREK) a klientovi (lead.email).

---

## 6. Kde je v kódu nastavená adresa API

V souboru **`diagnostika-jednatel-standalone.html`** je na řádku s `API_BASE`:

```javascript
var API_BASE = 'https://osobni-web-finance.vercel.app';
```

Pokud budeš používat jinou doménu (vlastní doména na Vercelu), změň ji zde na tu samou základní URL (bez `/api/...`).

---

## Shrnutí – co děláš ty

1. Účet na Resend → vytvoř API key → (volitelně) ověř doménu pro MAIL_FROM.  
2. Supabase → zkopíruj **service_role** key.  
3. Vercel → **Settings → Environment Variables** → přidej všech 6 proměnných.  
4. **Redeploy** projektu na Vercelu.  
5. Vyplň diagnostiku v prohlížeči, vygeneruj PDF, klikni **„Poslat výsledek na email“** a zkontroluj, že e-maily došly.

Pokud něco nebude fungovat, v prohlížeči (F12 → Network) uvidíš request na `/api/send-report` a jeho odpověď (status a tělo), což pomůže s laděním.
