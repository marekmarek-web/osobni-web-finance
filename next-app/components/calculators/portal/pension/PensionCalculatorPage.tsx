"use client";

import { useMemo, useState } from "react";
import { CalculatorEngagement } from "@/components/analytics/CalculatorEngagement";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { CalculatorPageShell } from "../core/CalculatorPageShell";
import { CalculatorMobileResultDock } from "../core/CalculatorMobileResultDock";
import { PensionContactModal } from "./PensionContactModal";
import { PensionInputPanel } from "./PensionInputPanel";
import { PensionResultsPanel } from "./PensionResultsPanel";
import { DEFAULT_STATE } from "@/lib/calculators/pension/pension.config";
import { runCalculations } from "@/lib/calculators/pension/pension.engine";
import type { PensionState } from "@/lib/calculators/pension/pension.types";

export function PensionCalculatorPage() {
  const [state, setState] = useState<PensionState>({ ...DEFAULT_STATE });
  const [leadOpen, setLeadOpen] = useState(false);
  const result = useMemo(() => runCalculations(state), [state]);

  const openLead = () => {
    track(AnalyticsEvents.calculatorCtaClick, { calculator: "pension" });
    setLeadOpen(true);
  };

  return (
    <>
      <CalculatorEngagement calculator="pension" />
      <div className="pt-0 pb-56 lg:pb-0">
        <CalculatorPageShell>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
            <PensionInputPanel
              state={state}
              onStateChange={setState}
              estimatedPension={result.estimatedPension}
            />
            <div className="hidden lg:block sticky top-6">
              <PensionResultsPanel result={result} onCtaPrimary={openLead} />
            </div>
          </div>
        </CalculatorPageShell>

        <CalculatorMobileResultDock>
          <PensionResultsPanel result={result} onCtaPrimary={openLead} />
        </CalculatorMobileResultDock>
      </div>
      <PensionContactModal
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        state={state}
        result={result}
      />
    </>
  );
}
