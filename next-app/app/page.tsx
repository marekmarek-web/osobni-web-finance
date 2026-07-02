import Link from "next/link";

const calculators = [
  { href: "/hypotecnikalkulacka", label: "Hypoteční kalkulačka", static: "/hypotecnikalkulacka/" },
  { href: "/zivotnikalkulacka", label: "Kalkulačka životního pojištění", static: "/zivotnikalkulacka/" },
  { href: "/investicnikalkulacka", label: "Investiční kalkulačka", static: "/investicnikalkulacka/" },
  { href: "/penzijnikalkulacka", label: "Penzijní kalkulačka", static: "/penzijnikalkulacka/" },
];

export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 min-h-[60vh]">
      <h1 className="text-3xl font-bold text-brand-dark mb-2">Marek Marek</h1>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">
        Finanční partner · Next.js kalkulačky
      </p>
      <p className="text-slate-600 mb-8 leading-relaxed">
        Chytřejší kalkulačky z Aidvisoru přenesené do Next.js. Produkční statické HTML v kořeni
        repozitáře zůstává beze změny — tato verze běží paralelně jako náhled.
      </p>
      <ul className="space-y-3">
        {calculators.map((c) => (
          <li
            key={c.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-border transition"
          >
            <Link href={c.href} className="text-brand-main font-bold hover:underline">
              {c.label}
            </Link>
            <p className="text-slate-500 text-sm mt-1">
              Produkce:{" "}
              <a href={c.static} className="underline hover:text-brand-main">
                {c.static}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
