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
import { InvestmentContactModal } from "./InvestmentContactModal";
import { InvestmentStrategySwitcher } from "./InvestmentStrategySwitcher";
import { InvestmentInputPanel } from "./InvestmentInputPanel";
import { InvestmentResultsPanel } from "./InvestmentResultsPanel";
import { InvestmentBacktestChart } from "./InvestmentBacktestChart";

const InvestmentGrowthChart = dynamic(
  () => import("./InvestmentGrowthChart").then((m) => m.InvestmentGrowthChart),
  { loading: () => <div className="h-[280px] animate-pulse rounded-lg bg-slate-50" aria-hidden /> },
);
const InvestmentAllocationChart = dynamic(
  () => import("./InvestmentAllocationChart").then((m) => m.InvestmentAllocationChart),
  { loading: () => <div className="h-[280px] animate-pulse rounded-lg bg-slate-50" aria-hidden /> },
);
import {
  INVESTMENT_PROFILES,
  HISTORICAL_DATA,
  INVESTMENT_DEFAULTS,
} from "@/lib/calculators/investment/investment.config";
import { computeProjection } from "@/lib/calculators/investment/investment.engine";
import { runBacktest } from "@/lib/calculators/investment/investment.backtest";
import {
  getGrowthChartData,
  getAllocationChartData,
  getBacktestChartSeries,
} from "@/lib/calculators/investment/investment.charts";
import { formatCurrency } from "@/lib/calculators/investment/formatters";

export function InvestmentCalculatorPage() {
  const [initial, setInitial] = useState<number>(INVESTMENT_DEFAULTS.initialDefault);
  const [monthly, setMonthly] = useState<number>(INVESTMENT_DEFAULTS.monthlyDefault);
  const [years, setYears] = useState<number>(INVESTMENT_DEFAULTS.yearsDefault);
  const [profileIndex, setProfileIndex] = useState<number>(INVESTMENT_DEFAULTS.profileIndexDefault);
  const [startYear, setStartYear] = useState<number>(INVESTMENT_DEFAULTS.startYearDefault);
  const [leadOpen, setLeadOpen] = useState(false);

  const openLead = () => {
    track(AnalyticsEvents.calculatorCtaClick, { calculator: "investment" });
    setLeadOpen(true);
  };

  const profile = INVESTMENT_PROFILES[profileIndex] ?? INVESTMENT_PROFILES[1];

  const projection = useMemo(
    () => computeProjection({ initial, monthly, years, profile }),
    [initial, monthly, years, profile],
  );
  const backtestResult = useMemo(() => runBacktest(monthly, startYear, HISTORICAL_DATA), [monthly, startYear]);
  const growthChartData = useMemo(() => getGrowthChartData(projection, profile.color), [projection, profile.color]);
  const allocationChartData = useMemo(() => getAllocationChartData(profile), [profile]);
  const backtestSeries = useMemo(() => getBacktestChartSeries(backtestResult), [backtestResult]);

  return (
    <>
    <CalculatorEngagement calculator="investment" />
    <div className="pt-0 pb-56 lg:pb-0">
      <CalculatorPageShell>
        <CalculatorMarketingHero badge={<CalculatorGoogleReviewBadge />}>
          <h1 className="mb-4 max-w-4xl text-3xl font-extrabold leading-[1.15] text-brand-navy md:text-5xl md:leading-tight">
            <span className="block">Investiční kalkulačka</span>
            <span className="mt-1 block text-brand-navy">Výpočet hodnoty investice v čase</span>
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-600">
            Spočítejte si orientačně, jak se může vyvíjet vaše pravidelná investice v čase podle zvolené strategie.
            Výsledky slouží jako podklad pro další plánování.
          </p>
          <InvestmentStrategySwitcher
            variant="hero"
            profiles={INVESTMENT_PROFILES}
            activeIndex={profileIndex}
            onSelect={setProfileIndex}
          />
          <p className="mt-2 text-sm text-slate-500">
            Předpokládaný výnos:{" "}
            <span className="font-bold text-brand-navy">{profile.rate}</span>% p.a. (
            <span className="font-medium">
              {profileIndex === 0 ? "Konzervativní profil" : profileIndex === 1 ? "Vyvážený profil" : "Dynamický profil"}
            </span>
            )
          </p>
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
              Tato kalkulačka slouží k orientačnímu výpočtu, jak se může vyvíjet hodnota vaší investice v čase při
              pravidelném investování. Zohledňuje výši počátečního vkladu, měsíční investici, investiční horizont a
              zvolenou strategii.
            </p>
            <p>
              Výsledkem je přehledná projekce budoucí hodnoty investice a celkového zhodnocení. Kalkulačka pracuje s
              dlouhodobým pohledem a principem složeného úročení.
            </p>
            <p>Výpočty jsou orientační a nezohledňují individuální daňové či legislativní aspekty.</p>
            <p>Slouží jako podklad pro pochopení rozdílů mezi jednotlivými strategiemi a pro další rozhodování.</p>
          </div>
        </div>

        {/* Main grid: input | result */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
          <InvestmentInputPanel
            initial={initial}
            monthly={monthly}
            years={years}
            onInitialChange={setInitial}
            onMonthlyChange={setMonthly}
            onYearsChange={setYears}
            profileTitle={profile.name}
            profileDescription={profile.description}
          />
          <div className="hidden lg:block sticky top-6">
            <InvestmentResultsPanel
              totalBalance={projection.totalBalance}
              totalInvested={projection.totalInvested}
              totalGain={projection.totalGain}
              totalGainPercent={projection.totalGainPercent}
              onCtaClick={openLead}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[20px] border-[1.5px] border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-bold text-[#0d1f4e] mb-1">Projekce vývoje</h3>
            <p className="text-xs text-[#475569] mb-4">Odhadovaný vývoj hodnoty investice v čase.</p>
            <InvestmentGrowthChart data={growthChartData} />
          </div>
          <div className="rounded-[20px] border-[1.5px] border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-bold text-[#0d1f4e] mb-1">Složení portfolia</h3>
            <p className="text-xs text-[#475569] mb-4">Rozdělení strategie podle tříd aktiv.</p>
            <InvestmentAllocationChart data={allocationChartData} />
          </div>
        </div>

        {/* Backtest */}
        <div className="rounded-[20px] border-[1.5px] border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6 md:p-7">
          <InvestmentBacktestChart
            series={backtestSeries}
            monthlyFormatted={formatCurrency(monthly)}
            startYear={startYear}
            onStartYearChange={setStartYear}
          />
        </div>
      </CalculatorPageShell>

      <CalculatorMobileResultDock>
        <InvestmentResultsPanel
          totalBalance={projection.totalBalance}
          totalInvested={projection.totalInvested}
          totalGain={projection.totalGain}
          totalGainPercent={projection.totalGainPercent}
          onCtaClick={openLead}
        />
      </CalculatorMobileResultDock>
    </div>
    <InvestmentContactModal
      open={leadOpen}
      onClose={() => setLeadOpen(false)}
      profileName={profile.name}
      initial={initial}
      monthly={monthly}
      years={years}
    />
    </>
  );
}
