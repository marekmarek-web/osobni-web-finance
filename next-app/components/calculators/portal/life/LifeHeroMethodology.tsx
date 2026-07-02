"use client";

import { HeartPulse, ShieldCheck, TrendingUp } from "lucide-react";

export function LifeHeroMethodology() {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Metodika</label>
      <div className="inline-flex w-fit flex-wrap gap-1 rounded-xl border border-brand-line bg-white/80 p-1.5">
        <div className="inline-flex items-center gap-2 rounded-lg border border-brand-line bg-white px-5 py-3 text-sm font-bold text-brand-navy shadow-md">
          <HeartPulse className="h-4 w-4 shrink-0" aria-hidden />
          Analýza potřeb
        </div>
        <div className="group relative inline-flex cursor-help items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-slate-600 transition-all duration-200 hover:bg-white hover:text-brand-navy">
          <TrendingUp className="h-4 w-4 shrink-0 text-brand-cyan" aria-hidden />
          6% Rentiér
          <div className="pointer-events-none invisible absolute left-0 top-full z-50 mt-3 w-[280px] translate-y-2 transform rounded-xl border border-slate-100 bg-white p-4 text-left text-xs font-normal text-slate-800 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 sm:w-80">
            <p className="leading-relaxed">
              <strong>Rentiérský výpočet:</strong> Pojistná částka (např. 1 mil. Kč) se zainvestuje s výnosem 6 % p.a.
              To generuje rentu 60 000 Kč ročně (5 000 Kč měsíčně), která dlouhodobě dorovnává výpadek příjmu při
              invaliditě.
            </p>
            <div className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-slate-100 bg-white" />
          </div>
        </div>
        <div className="group relative inline-flex cursor-help items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-slate-600 transition-all duration-200 hover:bg-white hover:text-brand-navy">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          Dle metodiky EFPA
          <div className="pointer-events-none invisible absolute left-0 top-full z-50 mt-3 w-[260px] translate-y-2 transform rounded-xl border border-slate-100 bg-white p-4 text-left text-xs font-normal text-slate-800 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 sm:w-72">
            <p className="leading-relaxed">
              <strong>EFPA (European Financial Planning Association)</strong> je organizace určující evropské standardy
              v oblasti finančního poradenství a plánování. Metodika zaručuje objektivní a profesionální výpočet.
            </p>
            <div className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-slate-100 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
