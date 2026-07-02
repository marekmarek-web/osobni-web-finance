import type { LoanType, MortgageProduct, MortgageType } from './mortgage-engine';
import type { BankRate } from './mortgage-engine';

export interface ProductSubType {
  id: string;
  label: string;
  info: string;
}

export const BANKS_DATA: BankRate[] = [
  { id: 'fio', name: 'Fio banka', baseRate: 4.18, loanRate: 5.9, logoUrl: '/images/fio-logo.png' },
  { id: 'moneta', name: 'Moneta Money Bank', baseRate: 4.19, loanRate: 6.0, logoUrl: '/images/moneta-logo.png' },
  { id: 'ucb', name: 'UniCredit Bank', baseRate: 4.29, loanRate: 6.5, logoUrl: '/images/unicredit-logo.png' },
  { id: 'airbank', name: 'Air Bank', baseRate: 4.39, loanRate: 6.2, logoUrl: '/images/airbank-logo.png' },
  { id: 'rb', name: 'Raiffeisenbank', baseRate: 4.34, loanRate: 5.9, logoUrl: '/images/raiffeisenbank-logo.png' },
  { id: 'partners', name: 'Partners Banka', baseRate: 4.59, loanRate: 6.4, logoUrl: '/images/partners-logo.png' },
  { id: 'csob', name: 'ČSOB / Hypoteční banka', baseRate: 4.79, loanRate: 7.9, logoUrl: '/images/csob-logo.png' },
  { id: 'kb', name: 'Komerční banka', baseRate: 4.59, loanRate: 6.9, logoUrl: '/images/kb-logo.png' },
  { id: 'cs', name: 'Česká spořitelna', baseRate: 4.59, loanRate: 7.5, logoUrl: '/images/ceskasporitelna-logo.png' },
  { id: 'mbank', name: 'mBank', baseRate: 4.79, loanRate: 6.2, logoUrl: '/images/mbank-logo.png' },
];

export const PRODUCT_TYPES: Record<
  MortgageProduct,
  ProductSubType[]
> = {
  mortgage: [
    {
      id: 'standard',
      label: 'Klasická',
      info: 'Nejčastější hypotéka na vlastní bydlení. Výhodná sazba a možnost LTV až 90 %.',
    },
    {
      id: 'investment',
      label: 'Investiční',
      info: 'Hypotéka na nemovitost k pronájmu. Pozor: LTV je bankami omezeno na maximálně 70 %.',
    },
    {
      id: 'american',
      label: 'Americká',
      info: 'Neúčelová hypotéka zajištěná nemovitostí. Peníze můžete použít na cokoliv, ale sazba bývá vyšší. Max LTV 70 %.',
    },
  ],
  loan: [
    {
      id: 'consumer',
      label: 'Spotřebitelský',
      info: 'Klasická půjčka na cokoliv bez zajištění nemovitostí. Rychlé vyřízení.',
    },
    {
      id: 'auto',
      label: 'Auto / Leasing',
      info: 'Účelová půjčka na nákup automobilu. Často s výhodnější sazbou než běžný úvěr.',
    },
    {
      id: 'consolidation',
      label: 'Konsolidace',
      info: 'Sloučení více půjček, kreditek a kontokorentů do jedné. Získáte nižší splátku a lepší přehled.',
    },
  ],
};

export const LIMITS = {
  mortgage: { min: 500_000, max: 30_000_000, step: 100_000, default: 5_000_000 },
  loan: { min: 20_000, max: 2_500_000, step: 5_000, default: 200_000 },
} as const;

export const DEFAULT_MORTGAGE_STATE = {
  product: 'mortgage' as MortgageProduct,
  mortgageType: 'standard' as MortgageType,
  loanType: 'consumer' as LoanType,
  loan: 5_000_000,
  own: 500_000,
  extra: 0,
  term: 30,
  fix: 5,
  type: 'new' as const,
  ltvLock: 90 as number | null,
};

export const MORTGAGE_LTV_VALUES = [90, 80, 70, 60, 50];
export const AUTO_DOWN_PAYMENT_VALUES = [0, 10, 20, 30, 40, 50];
