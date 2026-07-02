import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { CalculatorPreviewBanner } from "@/components/calculators/CalculatorPreviewBanner";

const LifeCalculatorPage = dynamic(
  () =>
    import("@/components/calculators/portal/life/LifeCalculatorPage").then(
      (m) => m.LifeCalculatorPage
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
  title: "Kalkulačka životního pojištění | Marek Marek",
  description: "Orientační výpočet potřebného krytí podle FP modelu.",
};

export default function ZivotniKalkulackaPage() {
  return (
    <main id="site-main" className="main-with-header pb-16 bg-[#f4f6fb] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4">
        <CalculatorPreviewBanner staticPath="/zivotnikalkulacka/" label="kalkulačka životního pojištění" />
        <LifeCalculatorPage />
      </div>
    </main>
  );
}
