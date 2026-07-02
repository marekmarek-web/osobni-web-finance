"use client";

import { HandCoins, Home } from "lucide-react";
import type { ProductType, TabType } from "@/lib/calculators/mortgage";

export interface MortgageHeroTopControlsProps {
  product: ProductType;
  type: TabType;
  onProductChange: (product: ProductType) => void;
  onTypeChange: (type: TabType) => void;
}

export function MortgageHeroTopControls({
  product,
  type,
  onProductChange,
  onTypeChange,
}: MortgageHeroTopControlsProps) {
  const isMortgage = product === "mortgage";

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 inline-flex w-fit rounded-xl border border-brand-line bg-white/80 p-1">
        <button
          type="button"
          onClick={() => onProductChange("mortgage")}
          className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
            isMortgage
              ? "border border-brand-line bg-white text-brand-navy shadow-md"
              : "text-slate-600 hover:bg-white hover:text-brand-navy"
          }`}
        >
          <Home className="h-4 w-4 shrink-0" aria-hidden />
          Hypotéka
        </button>
        <button
          type="button"
          onClick={() => onProductChange("loan")}
          className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
            product === "loan"
              ? "border border-brand-line bg-white text-brand-navy shadow-md"
              : "text-slate-600 hover:bg-white hover:text-brand-navy"
          }`}
        >
          <HandCoins className="h-4 w-4 shrink-0" aria-hidden />
          Úvěry
        </button>
      </div>

      <div className="inline-flex w-fit rounded-xl border border-brand-line bg-white/60 p-1.5 transition-all duration-300">
        <button
          type="button"
          onClick={() => onTypeChange("new")}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-all duration-200 ${
            type === "new"
              ? "border border-brand-line bg-white text-brand-navy shadow-md"
              : "text-slate-600 hover:bg-white hover:text-brand-navy"
          }`}
        >
          {isMortgage ? "Nová hypotéka" : "Nový úvěr"}
        </button>
        <button
          type="button"
          onClick={() => onTypeChange("refi")}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-all duration-200 ${
            type === "refi"
              ? "border border-brand-line bg-white text-brand-navy shadow-md"
              : "text-slate-600 hover:bg-white hover:text-brand-navy"
          }`}
        >
          Refinancování
        </button>
      </div>
    </div>
  );
}
