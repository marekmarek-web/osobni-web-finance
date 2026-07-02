"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PENSION_HERO_IMAGE } from "@/lib/media/pension-hero";

export function PensionFullscreenHero() {
  return (
    <section className="relative flex min-h-[calc(100dvh-5.5rem)] items-center overflow-hidden bg-[#0a0f29] pb-16 pt-10 md:min-h-[calc(100dvh-6rem)] md:pt-20">
      <div className="absolute inset-0 z-0">
        <Image
          src={PENSION_HERO_IMAGE.src}
          alt={PENSION_HERO_IMAGE.alt}
          fill
          className={PENSION_HERO_IMAGE.className}
          priority
          sizes={PENSION_HERO_IMAGE.sizes}
          quality={PENSION_HERO_IMAGE.quality}
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-navy/85 via-brand-navy/70 to-brand-navy/85"
          aria-hidden
        />
        <div
          className="absolute right-[-5%] top-[-10%] h-[800px] w-[800px] rounded-full bg-brand-cyan/15 opacity-60 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-brand-cyan/10 opacity-40 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:px-8">
        <div className="flex-1 pt-10 text-center max-w-2xl lg:max-w-2xl lg:pt-0 lg:text-left">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-cyan" />
            Finanční Strategie 2026
          </div>

          <h1 className="mb-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-white xs:text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl">
            Máte hypotéku <br />i pojistku.
          </h1>
          <h2 className="mb-8 text-3xl font-extrabold leading-[1.1] tracking-tight text-white xs:text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl">
            Ale <span className="text-gradient-shimmer-light">máte plán?</span>
          </h2>

          <p className="mx-auto mb-10 max-w-xl text-lg font-light leading-relaxed text-slate-400 lg:mx-0">
            Jednotlivé produkty bez strategie jsou jako dům bez základů. V roce 2026 už nestačí jen &quot;spořit&quot;.
            Musíte řídit svá aktiva matematicky.
          </p>

          <div className="flex flex-col justify-center gap-5 sm:flex-row lg:justify-start">
            <button
              type="button"
              className="cta-penze-btn group inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-5 text-lg font-extrabold sm:w-auto"
              onClick={() => document.getElementById("kalkulacka")?.scrollIntoView({ behavior: "smooth" })}
            >
              <span>Spočítat si důchod</span>
              <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-1" aria-hidden />
            </button>
            <Link
              href="/kalkulacky"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-center font-bold text-white transition-colors hover:bg-white/5"
            >
              Kalkulačky 2026
            </Link>
          </div>
        </div>

        <div className="pointer-events-none relative flex h-[400px] w-full max-w-[500px] flex-1 items-end justify-center lg:h-[700px] lg:max-w-[600px] lg:justify-end">
          <div className="absolute right-10 top-20 h-64 w-64 rounded-full bg-white/5 blur-[80px]" aria-hidden />
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/30">
        <ChevronDown className="h-8 w-8" aria-hidden />
      </div>
    </section>
  );
}
