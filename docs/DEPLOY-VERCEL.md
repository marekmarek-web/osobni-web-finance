# Deploy Next.js kalkulaček na Vercel

Produkční web běží na **osobni-web-finance.vercel.app** (nebo vlastní doméně). Po fázi 5 servíruje Next.js kalkulačky a statické stránky z jednoho deploye.

## Dva režimy konfigurace

### A) Root Directory = `next-app` (doporučeno)

1. Vercel Dashboard → Project → Settings → **Root Directory** → `next-app`
2. Zapni **Include source files outside of the Root Directory** (kvůli `scripts/` v kořeni)
3. Build Command (automaticky z `next-app/vercel.json`): `node ../scripts/vercel-build.mjs`
4. Legacy API (`send-report`, `create-checkout`, `stripe-webhook`) běží jako Next Route Handlers v `app/api/`

### B) Root Directory = kořen repa (zpětná kompatibilita)

Kořenový `vercel.json` obsahuje:

- `buildCommand`: `node scripts/vercel-build.mjs`
- `outputDirectory`: `next-app/.next`
- `functions` pro `api/*.js` (původní serverless)
- `rewrites` pro kalkulačky bez trailing slash

## Build lokálně

```bash
npm run vercel-build
# nebo
cd next-app && pnpm install && pnpm build && pnpm test:calc
```

Skript `scripts/sync-public-assets.mjs` zkopíruje před buildem:

- `images/`, `js/`, `calculations/`, statické stránky (`financni-plan/`, `gdpr/`, …)
- **Ne** kalkulační složky (`hypotecnikalkulacka/` atd.) — ty obsluhuje Next

## Env proměnné (Vercel)

| Proměnná | Účel |
|----------|------|
| `NEXT_PUBLIC_STATIC_SITE_ORIGIN` | Odkazy na statický web mimo Next (např. `https://marek-marek.cz`) |
| `NEXT_PUBLIC_CALCULATOR_PREVIEW` | `true` = žlutý náhledový banner; produkce nechte prázdné |
| `NEXT_PUBLIC_USE_STATIC_HOME` | `false` = Next rozcestník na `/`; výchozí přesměruje na `/index.html` |
| `RESEND_API_KEY`, `STRIPE_*`, `SUPABASE_*` | Legacy API (viz `.env.example`) |

## Routy po cutoveru

| URL | Obsluhuje |
|-----|-----------|
| `/hypotecnikalkulacka` | Next.js |
| `/zivotnikalkulacka` | Next.js |
| `/investicnikalkulacka` | Next.js |
| `/penzijnikalkulacka` | Next.js |
| `/api/leads`, `/api/calculators/rates` | Next.js |
| `/api/send-report`, `/api/create-checkout`, `/api/stripe-webhook` | Legacy handlers |
| `/`, `/financni-plan/`, `/gdpr/`, … | Statické HTML z `public/` (sync) |

## Cutover checklist

1. [ ] Nastavit Root Directory na Vercelu
2. [ ] Env proměnné zkopírovat z původního projektu
3. [ ] Deploy z větve s Next migrací
4. [ ] Ověřit: hypotéka 5M @ 90% LTV → úvěr 4,5M
5. [ ] Ověřit: `/api/send-report` (diagnostika) stále funguje
6. [ ] Ověřit: mobilní menu + header scroll
7. [ ] `NEXT_PUBLIC_CALCULATOR_PREVIEW` není nastaveno (produkce)
