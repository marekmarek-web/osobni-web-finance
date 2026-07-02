"use client";

import { CalculatorLeadModal } from "@/components/forms/CalculatorLeadModal";
import { formatCurrency } from "@/lib/calculators/investment/formatters";

export interface InvestmentContactModalProps {
  open: boolean;
  onClose: () => void;
  profileName: string;
  initial: number;
  monthly: number;
  years: number;
  onSubmitSuccess?: () => void;
}

export function InvestmentContactModal({
  open,
  onClose,
  profileName,
  initial,
  monthly,
  years,
  onSubmitSuccess,
}: InvestmentContactModalProps) {
  const resultSummary = [
    `Strategie: ${profileName}`,
    `Počáteční vklad: ${formatCurrency(initial)} Kč`,
    `Měsíční investice: ${formatCurrency(monthly)} Kč`,
    `Horizont: ${years} let`,
  ].join("\n");

  const metadata: Record<string, string> = {
    strategie: profileName,
    vklad: String(initial),
    mesicne: String(monthly),
    roky: String(years),
  };

  return (
    <CalculatorLeadModal
      open={open}
      onClose={onClose}
      calculatorType="investment"
      title="Doladit investiční strategii"
      subtitle="Nechte kontakt — připravím k vašim číslům nezávazné shrnutí a návrh dalšího kroku (osobně nebo online)."
      resultSummary={resultSummary}
      metadata={metadata}
      onSubmitSuccess={onSubmitSuccess}
    />
  );
}
