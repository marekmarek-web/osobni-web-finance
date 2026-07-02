import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { CalculatorPreviewBanner } from "@/components/calculators/CalculatorPreviewBanner";

const MortgageCalculatorPage = dynamic(
  () =>
    import("@/components/calculators/portal/mortgage/MortgageCalculatorPage").then(
      (m) => m.MortgageCalculatorPage
    ),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center text-brand-muted">
        Načítám kalkulačku…
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Hypoteční kalkulačka | Marek Marek",
  description: "Měsíční splátka, amortizace a srovnání nabídek bank.",
};

export default function HypotecniKalkulackaPage() {
  return (
    <main id="site-main" className="main-with-header pb-16 bg-[#f4f6fb] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4">
        <CalculatorPreviewBanner staticPath="/hypotecnikalkulacka/" label="hypoteční kalkulačka" />
        <MortgageCalculatorPage />
      </div>
    </main>
  );
}
