import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { CalculatorPreviewBanner } from "@/components/calculators/CalculatorPreviewBanner";

const PensionCalculatorPage = dynamic(
  () =>
    import("@/components/calculators/portal/pension/PensionCalculatorPage").then(
      (m) => m.PensionCalculatorPage
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
  title: "Penzijní kalkulačka | Marek Marek",
  description: "Státní příspěvky a mezera k cíli na důchod.",
};

export default function PenzijniKalkulackaPage() {
  return (
    <main id="site-main" className="main-with-header pb-16 bg-[#f4f6fb] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4">
        <CalculatorPreviewBanner staticPath="/penzijnikalkulacka/" label="penzijní kalkulačka" />
        <PensionCalculatorPage />
      </div>
    </main>
  );
}
