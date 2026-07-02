"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { CalculatorEngagement } from "@/components/analytics/CalculatorEngagement";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { CalculatorGoogleReviewBadge } from "../core/CalculatorGoogleReviewBadge";
import { CalculatorMarketingHero } from "../core/CalculatorMarketingHero";
import { CalculatorPageShell } from "../core/CalculatorPageShell";
import { CalculatorMobileResultDock } from "../core/CalculatorMobileResultDock";
import { LifeContactModal, type LifeModalType } from "./LifeContactModal";
import { LifeHeroMethodology } from "./LifeHeroMethodology";
import { LifeInputPanel } from "./LifeInputPanel";
import { LifeResultsPanel } from "./LifeResultsPanel";

const LifeRiskChart = dynamic(() => import("./LifeRiskChart").then((m) => m.LifeRiskChart), {
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-slate-50" aria-hidden />,
});
import { DEFAULT_STATE } from "@/lib/calculators/life/life.config";
import { runCalculations } from "@/lib/calculators/life/life.engine";
import type { LifeState } from "@/lib/calculators/life/life.types";

export function LifeCalculatorPage() {
  const [state, setState] = useState<LifeState>({ ...DEFAULT_STATE });
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadType, setLeadType] = useState<LifeModalType>("proposal");
  const result = useMemo(() => runCalculations(state), [state]);

  const openLead = (intent: LifeModalType) => {
    track(AnalyticsEvents.calculatorCtaClick, { calculator: "life", intent });
    setLeadType(intent);
    setLeadOpen(true);
  };

  return (
    <>
    <CalculatorEngagement calculator="life" />
    <div className="pt-0 pb-56 lg:pb-0">
      <CalculatorPageShell>
        <CalculatorMarketingHero overflow="hidden" badge={<CalculatorGoogleReviewBadge />}>
          <h2 className="mb-4 max-w-4xl text-3xl font-extrabold leading-[1.15] tracking-tight text-brand-navy md:text-5xl md:leading-tight">
            <span className="block">Kalkulačka životního pojištění</span>
            <span className="mt-1 block text-brand-navy">Výpočet potřebného krytí</span>
          </h2>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-600">
            Spočítejte si orientačně, jaké krytí životního pojištění dává smysl podle příjmu, výdajů a závazků. Výsledek
            vysvětlím a navrhnu další postup. Telefon je volitelný.
          </p>
          <LifeHeroMethodology />
        </CalculatorMarketingHero>

        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-brand-dark">
            <span className="text-brand-cyan" aria-hidden>
              ⓘ
            </span>
            Informace ke kalkulaci
          </h3>
          <div className="space-y-2 text-xs leading-relaxed text-slate-600 md:text-sm">
            <p>
              Tato kalkulačka slouží k orientačnímu výpočtu potřebného krytí životního pojištění na základě vašich
              příjmů, výdajů a závazků. Pomáhá získat základní přehled o tom, jaká pojistná ochrana může dávat smysl v
              konkrétní životní situaci.
            </p>
            <p>Výpočet zohledňuje zejména zajištění příjmů rodiny, závazky jako je hypotéka a délku ekonomické aktivity.</p>
            <p>Výsledné částky nejsou nabídkou pojištění, ale orientačním doporučením.</p>
            <p>
              Každá situace je individuální a finální nastavení se vždy řeší po osobní nebo online konzultaci, kde se
              vysvětlí jednotlivé možnosti a jejich dopad.
            </p>
          </div>
        </div>

        {/* Main grid: input | result */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
          <LifeInputPanel state={state} onStateChange={setState} />
          <div className="hidden lg:block sticky top-6">
            <LifeResultsPanel
              state={state}
              result={result}
              onCtaPrimary={() => openLead("proposal")}
              onCtaCheck={() => openLead("check")}
            />
          </div>
        </div>

        {/* Risk chart */}
        <div className="hidden md:block">
          <div className="rounded-[20px] border-[1.5px] border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-bold text-[#0d1f4e] mb-1">Analýza rizika (měsíční bilance)</h3>
            <p className="text-xs text-[#475569] mb-4">
              Propad příjmů v případě nemoci nebo invalidity a částka, kterou je třeba dokrýt.
            </p>
            <LifeRiskChart chartData={result.chartData} />
          </div>
        </div>
      </CalculatorPageShell>

      <CalculatorMobileResultDock>
        <LifeResultsPanel
          state={state}
          result={result}
          onCtaPrimary={() => openLead("proposal")}
          onCtaCheck={() => openLead("check")}
        />
      </CalculatorMobileResultDock>
    </div>
    <LifeContactModal
      open={leadOpen}
      onClose={() => setLeadOpen(false)}
      type={leadType}
      state={state}
      result={result}
    />
    </>
  );
}
