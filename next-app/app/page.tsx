import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Marek Marek – Next.js scaffold (fáze 1)</h1>
      <p>
        Inkrementální migrace z statického HTML. Produkční layout zůstává v kořenových
        HTML souborech; zde jsou zatím placeholdery pro klíčové trasy.
      </p>
      <ul>
        <li>
          <Link href="/hypotecnikalkulacka">Hypoteční kalkulačka</Link>
        </li>
        <li>
          <Link href="/zivotnikalkulacka">Kalkulačka životního pojištění</Link>
        </li>
      </ul>
    </main>
  );
}
