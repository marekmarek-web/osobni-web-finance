"use client";

import { useEffect } from "react";
import { AnalyticsEvents } from "@/lib/analytics/events";
import type { AnalyticsCalculatorId } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * První interakce uvnitř kalkulačky = „dokončil orientační použití“ (funnel).
 * Started při mount; completed při prvním pointerdown/keydown uvnitř [data-calculator-root].
 */
export function CalculatorEngagement({ calculator }: { calculator: AnalyticsCalculatorId }) {
  useEffect(() => {
    track(AnalyticsEvents.calculatorStarted, { calculator });
    const main = document.getElementById("site-main");
    if (!main) return;

    const onFirst = (e: Event) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const shell = t.closest("[data-calculator-root]");
      if (!shell) return;
      track(AnalyticsEvents.calculatorCompleted, { calculator });
      main.removeEventListener("pointerdown", onFirst, true);
      main.removeEventListener("keydown", onFirst, true);
    };

    main.addEventListener("pointerdown", onFirst, true);
    main.addEventListener("keydown", onFirst, true);
    return () => {
      main.removeEventListener("pointerdown", onFirst, true);
      main.removeEventListener("keydown", onFirst, true);
    };
  }, [calculator]);

  return null;
}
