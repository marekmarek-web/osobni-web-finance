"use client";

import { CalculatorGoogleReviewBadge } from "../core/CalculatorGoogleReviewBadge";

export function PensionSectionIntro() {
  return (
    <div className="relative z-10 mb-12">
      <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-brand-cyan">Kalkulačka 2026</span>
      <h2 className="mb-6 text-4xl font-black leading-tight text-brand-dark md:text-5xl">
        Realita důchodů 2026: <br />
        <span className="text-brand-main">Stát se o vás nepostará.</span>
      </h2>
      <p className="max-w-2xl text-lg text-slate-600">
        Důchodová reforma mění pravidla hry. Spočítejte si na <strong>přesné matematické kalkulačce</strong>, kolik
        musíte dnes začít odkládat do DPS/DIP, abyste si udrželi životní úroveň.
      </p>
      <div className="mt-6">
        <CalculatorGoogleReviewBadge />
      </div>
    </div>
  );
}
