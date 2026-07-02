import Link from "next/link";

const calculators = [
  { href: "/hypotecnikalkulacka", label: "Hypoteční kalkulačka", static: "/hypotecnikalkulacka/" },
  { href: "/zivotnikalkulacka", label: "Kalkulačka životního pojištění", static: "/zivotnikalkulacka/" },
  { href: "/investicnikalkulacka", label: "Investiční kalkulačka", static: "/investicnikalkulacka/" },
  { href: "/penzijnikalkulacka", label: "Penzijní kalkulačka", static: "/penzijnikalkulacka/" },
];

export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-navy mb-4">Marek Marek – Next.js kalkulačky</h1>
      <p className="text-slate-600 mb-6 leading-relaxed">
        Chytřejší kalkulačky z Aidvisor / premium-brokers (temp-marek) přenesené do tohoto repozitáře.
        Produkční statické HTML v kořeni zůstává beze změny — Next verze běží paralelně jako náhled.
      </p>
      <ul className="space-y-4">
        {calculators.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="text-brand-main font-semibold hover:underline">
              {c.label} (Next)
            </Link>
            <span className="text-slate-500 text-sm ml-2">
              · produkce:{" "}
              <a href={c.static} className="underline">
                {c.static}
              </a>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
