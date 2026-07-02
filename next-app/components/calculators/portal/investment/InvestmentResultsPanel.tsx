"use client";

import { formatCurrency } from "@/lib/calculators/investment/formatters";
import { PrimaryTailoredCtaButton } from "@/components/ui/PrimaryTailoredCta";
import { CalculatorResultsCard } from "../core/CalculatorResultsCard";

export interface InvestmentResultsPanelProps {
  totalBalance: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
  /** Optional: when provided, CTA button is shown (web/lead mode). */
  onCtaClick?: () => void;
}

export function InvestmentResultsPanel({
  totalBalance,
  totalInvested,
  totalGain,
  totalGainPercent,
  onCtaClick,
}: InvestmentResultsPanelProps) {
  const rows = [
    { label: "Váš vklad", value: `${formatCurrency(Math.round(totalInvested))} Kč` },
    {
      label: "Zisk z investice",
      value: `+${formatCurrency(Math.round(totalGain))} Kč`,
      highlight: "gain" as const,
    },
    {
      label: "Zhodnocení",
      value: `+${totalGainPercent.toFixed(1)} %`,
      highlight: "percent" as const,
    },
  ];

  return (
    <CalculatorResultsCard
      valueLabel="Předpokládaná hodnota"
      value={formatCurrency(Math.round(totalBalance))}
      unit="Kč"
      rows={rows}
      footnote="Výsledky vycházejí z modelového výpočtu a slouží pro ilustraci dlouhodobého vývoje investice."
      cta={
        onCtaClick != null ? (
          <>
            <PrimaryTailoredCtaButton surface="onDarkNavy" className="w-full" onClick={onCtaClick} />
            <p className="text-xs text-slate-500 mt-4 text-center leading-relaxed opacity-60">
              Historické výnosy nejsou zárukou budoucích. Výpočty jsou orientační.
            </p>
          </>
        ) : undefined
      }
    />
  );
}
