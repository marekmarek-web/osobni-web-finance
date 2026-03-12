# FP pro poradce – nastavení přihlášení a měsíčního předplatného

## Co je připraveno

1. **Stránka přihlášení a předplatného:** `fp-poradce-vstup.html`  
   - Přihlášení (e-mail + heslo), Registrace (e-mail, heslo, jméno, slug)  
   - Po přihlášení: tlačítko „Začít předplatné“ → přesměruje na Stripe Checkout  
   - Po zaplacení: zobrazení „Přejít do nástroje“ (wizard s vaším brandingem)

2. **Wizard (FP pro ostatní.html):**  
   - V hlavičce a v mobilní nabídce je odkaz **„Pro poradce: Přihlásit“** → vede na `fp-poradce-vstup.html`

3. **API (Vercel):**  
   - `POST /api/create-checkout` – vytvoří Stripe Checkout Session (měsíční předplatné), vyžaduje přihlášení (Bearer token)  
   - `POST /api/stripe-webhook` – po zaplacení / změně předplatného aktualizuje stav v tabulce `advisors`

4. **Supabase:**  
   - Tabulka `advisors` má sloupce: `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_current_period_end`  
   - Přihlášení přes Supabase Auth (e-mail/heslo)

---

## Nastavení na tvé straně

### 1. Stripe účet a produkt

1. Založ účet na [stripe.com](https://stripe.com) a přihlas se do Dashboardu.  
2. **Produkt pro předplatné:**  
   - Products → Add product  
   - Název např. „FP pro poradce – měsíčně“  
   - Pricing: **Recurring**, interval **Monthly**, cena např. **299 CZK**  
   - Ulož a zkopíruj **Price ID** (začíná `price_...`).

3. **API klíče:**  
   - Developers → API keys  
   - Zkopíruj **Secret key** (začíná `sk_test_` nebo `sk_live_`).

4. **Webhook:**  
   - Developers → Webhooks → Add endpoint  
   - URL: `https://osobni-web-finance.vercel.app/api/stripe-webhook`  
   - Události: zaškrtni `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`  
   - Po vytvoření zkopíruj **Signing secret** (začíná `whsec_...`).

### 2. Proměnné prostředí na Vercel

V projektu na Vercel (Settings → Environment variables) nastav:

| Název | Hodnota | Kde vzít |
|-------|---------|----------|
| `STRIPE_SECRET_KEY` | sk_test_... nebo sk_live_... | Stripe Dashboard → API keys |
| `STRIPE_PRICE_ID` | price_... | Stripe → Product → Price ID |
| `STRIPE_WEBHOOK_SECRET` | whsec_... | Stripe → Webhooks → Signing secret |
| `SUPABASE_URL` | https://xxx.supabase.co | už máš |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | eyJ... | Supabase → Settings → API (pro create-checkout volání auth) |

### 3. Odkaz na API na tvém webu

Stránka `fp-poradce-vstup.html` volá API pro vytvoření platby. Pokud máš **HTML na marek-marek.cz** a **API na Vercel**, musíš říct stránce adresu API:

Před načtením stránky (nebo v jednom skriptu na začátku) nastav:

```html
<script>
  window.FP_PORADCE_API_BASE = 'https://osobni-web-finance.vercel.app';
</script>
```

Pak se tlačítko „Začít předplatné“ obrátí na `https://osobni-web-finance.vercel.app/api/create-checkout`.

Pokud máš celou aplikaci (včetně API) na jednom Vercel projektu, `FP_PORADCE_API_BASE` nech prázdné – stránka bude volat `/api/create-checkout` na stejné doméně.

### 4. Struktura na www.marek-marek.cz

Doporučené rozložení:

- **Vstup pro poradce (přihlášení + předplatné):**  
  `https://www.marek-marek.cz/fp-poradce/prihlaseni.html`  
  Případně můžeš přejmenovat `fp-poradce-vstup.html` na `index.html` ve složce `fp-poradce`, pak stačí:  
  `https://www.marek-marek.cz/fp-poradce/`

- **Wizard (nástroj):**  
  `https://www.marek-marek.cz/fp-poradce/index.html` (nebo `FP pro ostatní.html`)  
  S tvým brandingem:  
  `https://www.marek-marek.cz/fp-poradce/index.html?poradce=marek-marek`

V obou souborech musí být na stejné úrovni i složka `images` (logo atd.), jak je teď v projektu.

---

## Průběh pro poradce

1. Poradce otevře **fp-poradce-vstup.html** (nebo tvou úvodní stránku pro FP pro poradce).  
2. **Registrace:** vyplní e-mail, heslo, jméno, slug → vytvoří se účet v Supabase a záznam v `advisors`.  
3. **Předplatné:** klikne na „Začít předplatné“ → přesměrování na Stripe Checkout → zaplatí.  
4. Stripe pošle webhook → v `advisors` se nastaví `subscription_status = active` a `subscription_current_period_end`.  
5. Na stránce vstupu se zobrazí „Přejít do nástroje“ → odkaz na wizard s `?poradce=jeho-slug`.  
6. Wizard se zobrazí s jeho brandingem (načteným z `advisors`). Odkaz s `?poradce=slug` může dávat klientům nebo vložit na svůj web (iframe/odkaz).

---

## Webhook a raw body (Vercel)

Stripe webhook ověřuje podpis z **surového těla** požadavku (raw body). Na Vercel může být tělo už parsované; pokud webhook bude vracet chybu ověření, můžeš:

- použít v Stripe Dashboardu „Send test webhook“ a ověřit, že endpoint odpovídá 200,  
- nebo webhook dočasně nasadit jinam (např. služba, která předá raw body).

Do kódu webhooku je už připravené načtení raw body v Node handleru; pokud budeš mít problémy s podpisem, napiš a doladíme to pro tvé nasazení.
