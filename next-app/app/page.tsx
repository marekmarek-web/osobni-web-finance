import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-dark mb-4">Marek Marek – Next.js migrace</h1>
      <p className="text-slate-600 mb-6 leading-relaxed">
        Inkrementální migrace z statického HTML. Produkční stránky v kořeni repozitáře zůstávají
        nedotčené; Next verze se vyvíjí paralelně ve fázi 2+.
      </p>
      <ul className="space-y-3">
        <li>
          <Link href="/hypotecnikalkulacka" className="text-brand-main font-semibold hover:underline">
            Hypoteční kalkulačka (Next – fáze 2)
          </Link>
          <span className="text-slate-500 text-sm ml-2">
            · produkce: <a href="/hypotecnikalkulacka/" className="underline">statické HTML</a>
          </span>
        </li>
        <li>
          <Link href="/zivotnikalkulacka" className="text-brand-main font-semibold hover:underline">
            Životní kalkulačka (placeholder)
          </Link>
        </li>
      </ul>
    </main>
  );
}
