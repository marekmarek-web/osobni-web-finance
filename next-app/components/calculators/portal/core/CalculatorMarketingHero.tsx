"use client";

import Image from "next/image";
import type { ReactNode } from "react";

export interface CalculatorMarketingHeroProps {
  children: ReactNode;
  /** Right column, e.g. Google review badge */
  badge?: ReactNode;
  /** Match životní kalkulačka HTML (`overflow-visible`) */
  overflow?: "hidden" | "visible";
  /** Plnobarevné logo ve vodoznaku (na světlém pozadí); HTML používá no-bg — obě varianty jsou v public/img/logos */
  watermarkSrc?: string;
  className?: string;
}

export function CalculatorMarketingHero({
  children,
  badge,
  overflow = "hidden",
  watermarkSrc = "/img/logos/pb-logo.png",
  className = "",
}: CalculatorMarketingHeroProps) {
  const overflowCls = overflow === "visible" ? "overflow-visible" : "overflow-hidden";

  return (
    <div
      className={`relative mb-10 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-brand-light to-slate-50/90 p-8 shadow-lg shadow-slate-900/5 md:p-12 ${overflowCls} ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden rounded-3xl" aria-hidden>
        <Image
          src={watermarkSrc}
          alt=""
          width={512}
          height={512}
          sizes="(max-width: 768px) 200px, 280px"
          className="absolute -bottom-8 -right-8 h-auto w-[min(22rem,52vw)] max-w-[240px] opacity-[0.14] sm:max-w-[280px] md:w-[min(26rem,40%)]"
          priority={false}
        />
      </div>
      <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">{children}</div>
        {badge ? <div className="flex w-full shrink-0 flex-col gap-3 lg:w-auto">{badge}</div> : null}
      </div>
    </div>
  );
}
