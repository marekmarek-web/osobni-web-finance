"use client";

import type { CalculatorPageShellProps } from "./types";

/**
 * Calculator page shell aligned with portal list pages (ListPageShell).
 * CRM mode: max-w-[1600px], consistent padding, space-y-6.
 */
export function CalculatorPageShell({
  children,
  maxWidth = "max-w-[1160px]",
  className = "",
}: CalculatorPageShellProps) {
  return (
    <div
      data-calculator-root
      className={`${maxWidth} mx-auto space-y-4 rounded-[22px] border border-slate-200/60 bg-white/90 p-4 shadow-sm shadow-slate-900/5 backdrop-blur-sm sm:p-6 ${className}`.trim()}
    >
      {children}
      <p className="text-center text-sm text-slate-500 pt-2">
        Orientační výpočet. Nejedná se o finanční poradenství ani závaznou nabídku.
      </p>
    </div>
  );
}
