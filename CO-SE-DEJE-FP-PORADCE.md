# Co se teď bude dít – FP pro poradce

## 1. Co už je hotové

- **Vercel:** Aplikace je nasazená na https://osobni-web-finance.vercel.app (API: create-checkout, stripe-webhook, send-report).
- **Stránka přihlášení** (`prihlaseni.html` ve složce fp-poradce) má výchozí adresu API na tuto Vercel URL – „Začít předplatné“ tedy volá tvé API bez další úpravy.
- **Wizard** má v menu odkaz „Pro poradce: Přihlásit“ → vede na přihlášení/předplatné.
- **Doporučení:** Pro produkt použij vlastní doménu (např. **fp-poradci.cz**), aby to nebylo pod tvým jménem – viz **DOMENA-PRODUKTU-FP-PORADCE.md**.

---

## 2. Co musíš ještě doplnit ty (jednorázově)

**Environment Variables na Vercelu** – bez nich předplatné nebude fungovat (create-checkout a webhook je potřebují).

1. Otevři **https://vercel.com** → projekt **osobni-web-finance** → **Settings** → **Environment Variables**.
2. Přidej tyto 4 proměnné (Production i Preview):

| Název | Hodnota | Kde vzít |
|-------|--------|----------|
| `STRIPE_SECRET_KEY` | `sk_test_...` nebo `sk_live_...` | Stripe → Developers → API keys |
| `STRIPE_PRICE_ID` | `price_...` | Stripe → Products → tvůj měsíční produkt (299 Kč) → Price ID |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe → Developers → Webhooks → přidej endpoint na `https://osobni-web-finance.vercel.app/api/stripe-webhook` → zkopíruj Signing secret |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API → **anon public** (ne service_role) |

3. Po uložení: **Deployments** → u posledního deploye ⋮ → **Redeploy**, aby se nové proměnné načetly.

**Proč to nemůžu doplnit za tebe:** Tyto hodnoty jsou tajné (klíče ke Stripe a Supabase). Do Vercelu je může doplnit jen někdo, kdo k nim má přístup – tedy ty v Dashboardu nebo přes `vercel env add` v terminálu (po přihlášení).

---

## 3. Průběh – co se bude dít

### Pro tebe (provozovatele)

1. Aplikace běží na **Vercel** (nebo na vlastní doméně produktu, např. **fp-poradci.cz** – viz DOMENA-PRODUKTU-FP-PORADCE.md). Ve složce **fp-poradce/** máš:
   - `prihlaseni.html` (přihlášení + předplatné),
   - `index.html` (wizard),
   - složku `images`.
2. Po doplnění env na Vercelu a redeployi bude „Začít předplatné“ posílat poradce na Stripe Checkout.
3. Po zaplacení Stripe zavolá tvůj webhook → v Supabase se poradci nastaví `subscription_status = active` a konec období.
4. Poradce uvidí „Přejít do nástroje“ a odkaz na wizard s `?poradce=jeho-slug`.

### Pro poradce

1. Otevře přihlášení – např. **https://fp-poradci.cz/fp-poradce/prihlaseni.html** (nebo tvou úvodní stránku na doméně produktu).
2. **Registrace:** e-mail, heslo, jméno, slug → účet v Supabase + záznam v tabulce `advisors`.
3. **Předplatné:** klik na „Začít předplatné“ → přesměrování na Stripe → zaplatí 299 Kč/měsíc.
4. Stripe pošle webhook na tvůj Vercel → u poradce v DB se nastaví aktivní předplatné.
5. Poradce klikne „Přejít do nástroje“ → otevře se wizard s jeho brandingem (`?poradce=jeho-slug`).
6. Ten odkaz může dávat klientům nebo vložit na svůj web (iframe/odkaz).

### Pro klienta poradce

- Otevře odkaz s `?poradce=slug` (např. od poradce nebo z jeho webu) → vidí wizard s brandingem toho poradce, bez přihlášení.

---

## 4. Shrnutí

| Krok | Kdo | Co se stane |
|------|-----|--------------|
| Doplnění env na Vercel | Ty | Jednorázově 4 proměnné + Redeploy. |
| Otevření stránky přihlášení | Poradce | Registrace / přihlášení (Supabase). |
| Klik na „Začít předplatné“ | Poradce | Přesměrování na Stripe, platba. |
| Webhook od Stripe | Vercel | Aktualizace `advisors.subscription_status` a období v Supabase. |
| „Přejít do nástroje“ | Poradce | Wizard s jeho brandingem, odkaz pro klienty. |

Jakmile máš na Vercelu doplněné env a uděláš Redeploy, můžeš celý flow vyzkoušet: registrace → předplatné → wizard.
