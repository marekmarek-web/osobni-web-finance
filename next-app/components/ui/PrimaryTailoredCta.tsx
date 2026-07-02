"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cta } from "@/config/cta";

/** Pozadí za tlačítkem — jen pro focus ring offset (stejné chování jako u kalkulaček). */
export type PrimaryTailoredCtaSurface = "onDarkNavy" | "onLight";

const surfaceFocusRing: Record<PrimaryTailoredCtaSurface, string> = {
  onDarkNavy: "focus-visible:ring-offset-[#0d1f4e]",
  onLight: "focus-visible:ring-offset-white",
};

/**
 * Jednotný primární CTA jako na životní kalkulačce: modré tlačítko, stejné zaoblení, typografie, šipka.
 */
export const primaryTailoredCtaClassName = (surface: PrimaryTailoredCtaSurface, extra = "") =>
  [
    "inline-flex min-h-[48px] items-center justify-center gap-3 rounded-[14px] bg-[#2563eb] px-6 py-4 text-sm sm:text-base font-bold text-white shadow-lg transition-all hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2",
    surfaceFocusRing[surface],
    extra,
  ]
    .join(" ")
    .trim();

function ArrowIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

type Common = {
  surface: PrimaryTailoredCtaSurface;
  className?: string;
  label?: string;
  children?: ReactNode;
};

export function PrimaryTailoredCtaButton({
  surface,
  className = "",
  label = cta.primaryTailored,
  children,
  ...rest
}: Common & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button type="button" className={primaryTailoredCtaClassName(surface, className)} {...rest}>
      {children ?? (
        <>
          <span>{label}</span>
          <ArrowIcon />
        </>
      )}
    </button>
  );
}

export function PrimaryTailoredCtaLink({
  surface,
  className = "",
  label = cta.primaryTailored,
  children,
  href,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link href={href} className={`${primaryTailoredCtaClassName(surface, className)} no-underline`} {...rest}>
      {children ?? (
        <>
          <span>{label}</span>
          <ArrowIcon />
        </>
      )}
    </Link>
  );
}
