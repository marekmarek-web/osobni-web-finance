import MortgageCalculator from '@/components/hypotecnikalkulacka/MortgageCalculator';

export const metadata = {
  title: 'Hypoteční kalkulačka | Marek Marek',
  description: 'Kalkulačka hypoték a úvěrů – srovnání bez kontaktu',
};

export default function HypotecniKalkulackaPage() {
  return (
    <main>
      <MortgageCalculator />
    </main>
  );
}
