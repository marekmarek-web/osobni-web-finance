"use client";

import { Scale, Shield, Zap } from "lucide-react";
import type { InvestmentProfile } from "@/lib/calculators/investment/investment.config";

const HERO_ICONS = [Shield, Scale, Zap] as const;
/** Zobrazení jako v legacy HTML (krátké názvy tlačítek). */
const HERO_LABELS = ["Konzervativní", "Vyvážená", "Dynamická"] as const;

export interface InvestmentStrategySwitcherProps {
  profiles: InvestmentProfile[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Styl jako legacy HTML hero (pilulky na světlém pozadí). */
  variant?: "default" | "hero";
}

export function InvestmentStrategySwitcher({
  profiles,
  activeIndex,
  onSelect,
  variant = "default",
}: InvestmentStrategySwitcherProps) {
  if (variant === "hero") {
    return (
      <div className="flex flex-col gap-4">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Vyberte strategii</label>
        <div className="inline-flex w-fit flex-wrap gap-1 rounded-xl border border-brand-line bg-white/80 p-1.5">
          {profiles.map((profile, index) => {
            const isActive = index === activeIndex;
            const Icon = HERO_ICONS[index] ?? Shield;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(index)}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "border border-brand-line bg-white text-brand-navy shadow-md"
                    : "text-slate-600 hover:bg-white hover:text-brand-navy"
                }`}
                data-profile={index}
                aria-pressed={isActive}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {HERO_LABELS[index] ?? profile.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Vyberte strategii
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {profiles.map((profile, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`group flex min-h-[44px] touch-manipulation items-center justify-center rounded-[10px] border-[1.5px] px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                isActive
                  ? "border-[#0d1f4e] bg-[#0d1f4e] text-white shadow-sm"
                  : "border-slate-300 bg-white text-slate-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
              }`}
              data-profile={index}
              aria-pressed={isActive}
            >
              <span className="truncate">{profile.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
