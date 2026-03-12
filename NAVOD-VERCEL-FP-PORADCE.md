# Vercel – co přidat pro FP pro poradce (předplatné)

Tvůj projekt už na Vercelu běží (např. **osobni-web-finance.vercel.app**). Stačí doplnit proměnné a redeploy.

---

## 1. Přidej Environment Variables na Vercelu

1. Přihlas se na **https://vercel.com** → vyber projekt (např. osobni-web-finance).
2. **Settings** → **Environment Variables**.
3. Přidej tyto proměnné (Production i Preview, pokud chceš testovat):

| Name | Value | Kde to vzít |
|------|--------|--------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` nebo `sk_live_...` | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_PRICE_ID` | `price_...` | Stripe → Products → tvůj měsíční produkt → Price ID |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe → Developers → Webhooks → Add endpoint → URL: `https://osobni-web-finance.vercel.app/api/stripe-webhook` → po vytvoření zkopíruj Signing secret |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API → Project API keys → **anon public** |

**Poznámka:** `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY` už máš z diagnostiky; `SUPABASE_ANON_KEY` je jiný klíč (anon public) – potřebný pro `/api/create-checkout` při ověření JWT.

---

## 2. Stripe – vytvoř produkt a webhook

- **Produkt:** Stripe Dashboard → Products → Add product → název např. „FP pro poradce“, cena 299 CZK, Recurring Monthly → ulož a zkopíruj **Price ID** (`price_...`).
- **Webhook:** Developers → Webhooks → Add endpoint:
  - **Endpoint URL:** `https://osobni-web-finance.vercel.app/api/stripe-webhook` (tvůj projekt)
  - **Events:** zaškrtni `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Uložit → zkopírovat **Signing secret** (`whsec_...`) do `STRIPE_WEBHOOK_SECRET`.

---

## 3. Redeploy

- Vercel → **Deployments** → u posledního deploye ⋮ → **Redeploy** (nebo push do GitHubu).

---

## 4. Ověření

- **Create-checkout:** Na stránce `fp-poradce-vstup.html` (s nastaveným `window.FP_PORADCE_API_BASE = 'https://osobni-web-finance.vercel.app'`) se přihlas a klikni „Začít předplatné“. Měl bys být přesměrován na Stripe Checkout.
- **Webhook:** Po testovací platbě ve Stripe (nebo po zaplacení) by se v Supabase v tabulce `advisors` měl u tvého řádku nastavit `subscription_status = active` a `subscription_current_period_end`.

---

## 5. Kde nastavit adresu API na webu

Na **www.marek-marek.cz** (kde máš nahrané `fp-poradce-vstup.html`) musí stránka vědět, kam posílat požadavky na předplatné. Před načtením stránky (nebo v hlavičce souboru) přidej:

```html
<script>
  window.FP_PORADCE_API_BASE = 'https://osobni-web-finance.vercel.app';
</script>
```

(Pokud používáš jinou Vercel doménu, nahraď ji.)

---

Shrnutí: přidáš na Vercel 4 proměnné (Stripe + SUPABASE_ANON_KEY), ve Stripe vytvoříš produkt a webhook, redeploy a na marek-marek.cz nastavíš `FP_PORADCE_API_BASE`.
