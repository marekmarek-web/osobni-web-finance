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
- [ ] Vizuální parita header/footer (až fáze 4)
- [ ] Přepnutí produkční URL (až fáze 5)

### Fáze 3 – Životní kalkulačka v Next

- [ ] Port `insurance-computation.js` → `lib/insurance-computation.ts`
- [ ] React UI podle `zivotnikalkulacka/index.html`
- [ ] FP model: invalidita (rent multiplier 200, +20 % nákladů), smrt (income replacement + 500k partner), TN 8×, PN RH 1633/2449/4897, zaokrouhlení 100k

### Fáze 4 – Sdílený layout

- [ ] `partials/header.html` + `partials/footer.html` → React `Header` / `Footer`
- [ ] Navigace, scroll header, dropdown Nástroje
- [ ] Fonty (Inter), brand barvy, Lucide/FontAwesome ekvivalenty

### Fáze 5 – Deploy a routing

- [ ] Vercel: monorepo nebo samostatný projekt `next-app/`
- [ ] Rewrites: vybrané cesty → Next, zbytek → statické soubory (nebo postupné nahrazení)
- [ ] E2E smoke testy hlavních URL

## Build a vývoj

```bash
cd next-app
pnpm install
pnpm dev    # lokální vývoj
pnpm build  # produkční build (povinný v CI)
```

## Co záměrně není v scope fáze 1

- Přesun celého `index.html`, `financni-plan/`, API routes
- Změna Vercel routingu produkce
- Odstranění statických HTML souborů

## Acceptance checklist (kalkulačky)

| Test | Očekávání |
|------|-----------|
| Hypotéka 5M @ 90% LTV | Úvěr 4 500 000 Kč, vlastní zdroje 500 000 Kč |
| Životní FP invalidita | Rent multiplier 200, +20 % nákladů, zaokrouhlení 100k |
| Životní FP smrt | Income replacement + 500k partner lump sum |
| TN pásma | 1M / 1,5M / 2M / 3M, progrese 8× |
| PN | RH 1633 / 2449 / 4897 |
| `pnpm build` v `next-app/` | Úspěšný build |
