import Link from "next/link";
import { redirect } from "next/navigation";
import { useStaticHomepage } from "@/lib/site-mode";

const calculators = [
  { href: "/hypotecnikalkulacka", label: "Hypoteční kalkulačka" },
  { href: "/zivotnikalkulacka", label: "Kalkulačka životního pojištění" },
  { href: "/investicnikalkulacka", label: "Investiční kalkulačka" },
  { href: "/penzijnikalkulacka", label: "Penzijní kalkulačka" },
];

export default function HomePage() {
  if (useStaticHomepage()) {
    redirect("/index.html");
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 min-h-[60vh]">
      <h1 className="text-3xl font-bold text-brand-dark mb-2">Marek Marek</h1>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">
        Finanční partner
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
          </li>
        ))}
      </ul>
    </main>
  );
}
