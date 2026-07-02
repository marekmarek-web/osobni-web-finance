# `@premium-brokers/calculators-core`

**Vendor kopie** výpočtů z `advisor-crm` (`apps/web/src/lib/calculators`), synchronizovaná pro paritu s CRM kalkulačkami.

## Napojení v Next aplikaci

Root `tsconfig.json` mapuje `@/lib/calculators/*` → `packages/calculators-core/src/*`.

## Poznámky

- Složka `src/pdf/` je z TypeScript buildu vynechána (závislost `pdf-lib`); na marketingovém webu se PDF export nepoužívá.
- `investment/faStrategyAdapter.ts` je zjednodušený stub (plná integrace jen v CRM).
