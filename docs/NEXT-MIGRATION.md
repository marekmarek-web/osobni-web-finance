# Plán migrace HTML → Next.js (inkrementální)

Cíl: postupně přesunout kalkulačky a další stránky do `next-app/` **bez regresí layoutu a funkčnosti**. Statické HTML v kořeni repozitáře zůstává produkce až do dokončení dané fáze.

## Stav fáze 1 (hotovo)

- `next-app/` – minimální Next.js 15 scaffold (App Router, TypeScript)
- Trasy (placeholdery):
  - `/` – rozcestník
  - `/hypotecnikalkulacka`
  - `/zivotnikalkulacka`
- `next-app/lib/mortgage-engine.ts` – TypeScript port z `calculations/mortgage-engine.js`
- Sdílená výpočetní logika v kořeni:
  - `calculations/insurance-computation.js` – FP model životního pojištění
  - `calculations/mortgage-engine.js` – hypotéka (LTV: `borrowingAmount = property × LTV%`)

## Stav fáze 2 (hotovo – pouze next-app, HTML beze změny)

- [x] React komponenta `MortgageCalculator` – slider nemovitosti, LTV tlačítka, výsledková karta
- [x] Import `lib/mortgage-engine.ts` + `lib/bank-offers.ts`
- [x] Parita labely: Hodnota nemovitosti / Výše úvěru / Vlastní zdroje
- [x] Bankovní nabídky a modal leadů (stejné hidden fieldy jako HTML)
- [x] `lib/form-spam-guard.ts` – port ochrany formulářů
- [x] Tailwind + Font Awesome v Next (bez zásahu do statického HTML)
- **Produkční `hypotecnikalkulacka/index.html` se neměnilo**

> **Pozn.:** Jednoduchá fáze-2 komponenta byla ve fázi 3 nahrazena portem z Aidvisoru (viz níže).

## Stav fáze 3 (hotovo – port kalkulaček z Aidvisoru / premium-brokers)

Zdroj: repozitář `marekmarek-web/temp-marek` (balíček `premium-brokers`). Kalkulačky jsou plnohodnotné Next.js portály s grafy, bankovními nabídkami a lead modaly.

### Co bylo přeneseno (pouze `next-app/`)

| Oblast | Cesta |
|--------|--------|
| Výpočetní jádro | `next-app/packages/calculators-core/src/` (hypotéka, život, investice, penze) |
| UI portály | `next-app/components/calculators/portal/` |
| Sdílené UI | `next-app/components/ui/`, `next-app/components/forms/` |
| API | `next-app/app/api/calculators/rates/`, `next-app/app/api/leads/` |
| Analytics / leady | `next-app/lib/analytics/`, `next-app/lib/forms/`, `next-app/lib/validation/` |
| Konfigurace | `next-app/config/site.ts`, `next-app/config/cta.ts` |

### Trasy v Next

- `/hypotecnikalkulacka` – hypoteční portál (bankovní nabídky, amortizace, lead modal)
- `/zivotnikalkulacka` – životní portál (FP model, graf rizik)
- `/investicnikalkulacka` – investiční portál (projekce, backtest, alokace)
- `/penzijnikalkulacka` – penzijní portál

Každá stránka může zobrazit `CalculatorPreviewBanner` (jen když `NEXT_PUBLIC_CALCULATOR_PREVIEW=true`).

### Úpravy logiky oproti Aidvisoru

- **Hypotéka:** `state.loan` = hodnota nemovitosti; `getBorrowingAmount()` = nemovitost × LTV % nebo nemovitost − vlastní zdroje (parita s `calculations/mortgage-engine.js`). LTV penalizace nad 90 %.
- **Životní:** FP model – invalidita (rent × 200, +20 %), smrt (income replacement + 500k partner), TN 8×, PN RH 1633/2449/4897, zaokrouhlení 100k (parita s `calculations/insurance-computation.js`).
- **Leady:** FormSubmit na `kontakt@marek-marek.cz` přes `/api/leads`.
- **Branding:** `config/site.ts` přepsán pro Marek Marek.

### Závislosti

`lucide-react`, `chart.js`, `react-chartjs-2`, `react-apexcharts`, `apexcharts`, `zod`

### Co záměrně nebylo přeneseno

- PDF export z calculators-core
- Unit testy z calculators-core (`__tests__/`)

**Produkční statické HTML (`hypotecnikalkulacka/`, `zivotnikalkulacka/`, …) v kořeni repa zůstává jako záloha — po cutoveru na Vercelu je obsluhuje Next.js.**

## Stav fáze 5 (hotovo – deploy a routing)

- [x] `scripts/sync-public-assets.mjs` – sync statických stránek do `next-app/public/` (bez kalkulaček)
- [x] `scripts/vercel-build.mjs` – sync + build + smoke testy
- [x] Kořenový `vercel.json` + `next-app/vercel.json` – build a rewrites
- [x] Legacy API (`send-report`, `create-checkout`, `stripe-webhook`) → Next Route Handlers
- [x] `next.config.ts` – redirecty z `/kalkulacka/index.html`, rewrites pro statické stránky
- [x] Produkční režim: banner jen když `NEXT_PUBLIC_CALCULATOR_PREVIEW=true`
- [x] Homepage `/` → `/index.html` (vypnout: `NEXT_PUBLIC_USE_STATIC_HOME=false`)
- [x] CI: `.github/workflows/ci.yml`
- [x] Dokumentace: `docs/DEPLOY-VERCEL.md`

### Po nasazení na Vercel

1. Nastavit **Root Directory** = `next-app` (doporučeno) nebo nechat kořen s `vercel.json`
2. Zkopírovat env proměnné (Resend, Stripe, Supabase)
3. **Ne** nastavovat `NEXT_PUBLIC_CALCULATOR_PREVIEW` v produkci
4. Ověřit kalkulačky a `/api/send-report`

## Stav fáze 4 (hotovo – sdílený layout)

- [x] React `SiteHeader` + `SiteFooter` podle `partials/header.html` a `partials/footer.html`
- [x] Scroll header (tmavý → skleněný bílý), dropdown Nástroje, mobilní menu
- [x] Font Inter + Font Awesome (už v layoutu od fáze 2)
- [x] Integrace v `app/layout.tsx`

## Princip migrace

1. **Výpočty nejdřív do sdílených modulů** – HTML i Next importují stejnou logiku (JS/TS port).
2. **Jedna stránka = jedna fáze** – nejdřív kalkulačka, pak header/footer, pak landing.
3. **Parita před přepnutím DNS/redirectu** – vizuální diff + acceptance testy (např. 5M @ 90% LTV → úvěr 4,5M, vlastní 500k).
4. **Layout 1:1** – Tailwind třídy a struktura DOM kopírovat z existujícího HTML; žádné redesigny během migrace.
5. **Produkční HTML neměnit**, dokud Next verze není schválená.

## Doporučené fáze

### Fáze 2 – Hypoteční kalkulačka v Next ✅

- [x] React komponenty pro slider nemovitosti, LTV tlačítka, výsledkovou kartu
- [x] Import `lib/mortgage-engine.ts`
- [x] Parita s `hypotecnikalkulacka/index.html` (labely, LTV, bankovní nabídky)
- [x] Formulář leadů – stejné hidden fieldy jako ve statickém HTML

### Fáze 3 – Port Aidvisor kalkulaček ✅

- [x] `packages/calculators-core` – hypotéka, život, investice, penze
- [x] Portal UI komponenty (grafy, bankovní nabídky, lead modaly)
- [x] FP model životního pojištění v `life.engine.ts`
- [x] Property-based LTV v `mortgage.engine.ts`
- [x] API routes pro sazby a leady
- [ ] Synchronizace root `calculations/*.js` ↔ calculators-core (volitelné)

### Fáze 4 – Sdílený layout ✅

- [x] `SiteHeader` – glass header, scroll efekt, dropdown Nástroje, mobilní drawer
- [x] `SiteFooter` – menu, kontakt, sociální sítě, GDPR/cookies
- [x] CSS parita: `.glass-header-top`, `.glass-header-scrolled`, `.nav-link`, `.nav-dropdown-*`
- [x] Integrace v `app/layout.tsx` (header + footer na všech stránkách)
- [x] `NEXT_PUBLIC_STATIC_SITE_ORIGIN` pro odkazy na statický web mimo Next trasy

### Fáze 5 – Deploy a routing ✅

- [x] Vercel build skripty a `vercel.json`
- [x] Sync statických stránek do `next-app/public/`
- [x] Rewrites/redirects pro kalkulačky a legacy stránky
- [x] Legacy API route handlery
- [x] CI workflow + smoke testy (hypotéka + životní)
- [x] `docs/DEPLOY-VERCEL.md`

## Build a vývoj

```bash
# Plný produkční build (sync + build + testy)
npm run vercel-build

# Pouze Next
cd next-app
pnpm install
pnpm dev
pnpm build
pnpm test:calc
```

## Co záměrně není v scope (budoucí práce)

- Přesun celého `index.html` hero/landing do React komponent (zatím sync statického HTML)
- Odstranění statických kalkulaček z kořene repa (až po ověření produkce)
- PDF export z calculators-core

## Acceptance checklist (kalkulačky)

| Test | Očekávání |
|------|-----------|
| Hypotéka 5M @ 90% LTV | Úvěr 4 500 000 Kč, vlastní zdroje 500 000 Kč |
| Životní FP invalidita | Rent multiplier 200, +20 % nákladů, zaokrouhlení 100k |
| Životní FP smrt | Income replacement + 500k partner lump sum |
| TN pásma | 1M / 1,5M / 2M / 3M, progrese 8× |
| PN | RH 1633 / 2449 / 4897 |
| `pnpm build` v `next-app/` | Úspěšný build |
| `pnpm test:calc` | Hypotéka LTV + životní FP model |
| `npm run vercel-build` | Sync + build + testy |
| CI GitHub Actions | Prochází |
