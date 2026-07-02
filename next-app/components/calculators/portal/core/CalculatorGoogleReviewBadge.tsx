"use client";

import { GoogleMark } from "@/components/ui/GoogleMark";

export function CalculatorGoogleReviewBadge() {
  return (
    <a
      href="https://www.google.com/search?q=premium+brokers+roudnice"
      target="_blank"
      rel="noopener noreferrer"
      className="review-badge flex min-w-[240px] items-center gap-4 rounded-xl bg-white px-4 py-3 text-slate-800 shadow-lg no-underline transition-colors group"
    >
      <div className="shrink-0 rounded-full border border-slate-100 bg-white p-1.5">
        <GoogleMark className="h-5 w-5" />
      </div>
      <div>
        <div className="mb-0.5 flex items-center gap-1.5">
          <span className="text-lg font-bold">4,9</span>
          <div className="flex text-xs text-amber-400" aria-hidden="true">
            {"★★★★★"}
          </div>
          <span className="text-xs text-slate-400">(45)</span>
        </div>
        <div className="text-xs font-semibold text-slate-500 transition-colors group-hover:text-brand-navy">
          Zobrazit recenze
        </div>
      </div>
    </a>
  );
}
