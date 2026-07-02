import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { CalculatorPreviewBanner } from "@/components/calculators/CalculatorPreviewBanner";

const InvestmentCalculatorPage = dynamic(
  () =>
    import("@/components/calculators/portal/investment/InvestmentCalculatorPage").then(
      (m) => m.InvestmentCalculatorPage
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
  title: "Investiční kalkulačka | Marek Marek",
  description: "Projekce zhodnocení úspor v čase.",
};

export default function InvesticniKalkulackaPage() {
  return (
    <main id="site-main" className="main-with-header pt-24 pb-16 bg-[#f4f6fb] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4">
        <CalculatorPreviewBanner staticPath="/investicnikalkulacka/" label="investiční kalkulačka" />
        <InvestmentCalculatorPage />
      </div>
    </main>
  );
}
