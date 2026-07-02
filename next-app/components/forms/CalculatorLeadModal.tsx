"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { cta } from "@/config/cta";
import { siteConfig } from "@/config/site";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { postLeadFormData, postLeadJson } from "@/lib/forms/postLeadApi";
import type { CalculatorLeadBody } from "@/lib/validation/calculatorLeadSchema";

export type CalculatorLeadModalProps = {
  open: boolean;
  onClose: () => void;
  calculatorType: "pension" | "life" | "mortgage" | "investment";
  title: string;
  subtitle?: string;
  resultSummary: string;
  metadata: Record<string, string>;
  /** Životní: typ modalu + příloha u kontroly smlouvy */
  lifeIntent?: "general" | "proposal" | "check";
  showAttachment?: boolean;
  onSubmitSuccess?: () => void;
};

export function CalculatorLeadModal({
  open,
  onClose,
  calculatorType,
  title,
  subtitle,
  resultSummary,
  metadata,
  lifeIntent,
  showAttachment,
  onSubmitSuccess,
}: CalculatorLeadModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState("");

  useEffect(() => {
    if (open) {
      track(AnalyticsEvents.leadModalOpen, { calculator: calculatorType });
      setOpenedAt(Date.now());
      setStatus("idle");
      setErrorMsg(null);
      setCompanyWebsite("");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setNote("");
      setFile(null);
    }
  }, [open, calculatorType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStatus("loading");

    const base: CalculatorLeadBody = {
      source: "calculator",
      calculatorType,
      lifeIntent: calculatorType === "life" ? lifeIntent : undefined,
      name,
      email,
      phone: phone.trim() || undefined,
      note: note.trim() || undefined,
      sourcePath: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
      resultSummary,
      metadata,
      companyWebsite: companyWebsite.trim() || undefined,
      formOpenedAt: openedAt ?? undefined,
    };

    try {
      if (showAttachment && file) {
        const fd = new FormData();
        fd.set("source", "calculator");
        fd.set("calculatorType", calculatorType);
        if (lifeIntent) fd.set("lifeIntent", lifeIntent);
        fd.set("name", name);
        fd.set("email", email);
        if (phone.trim()) fd.set("phone", phone);
        if (note.trim()) fd.set("note", note);
        fd.set("sourcePath", base.sourcePath ?? "");
        fd.set("resultSummary", resultSummary);
        fd.set("metadataJson", JSON.stringify(metadata));
        if (companyWebsite.trim()) fd.set("companyWebsite", companyWebsite.trim());
        else fd.set("companyWebsite", "");
        fd.set("formOpenedAt", String(openedAt ?? ""));
        fd.set("attachment", file);
        const res = await postLeadFormData(fd);
        if (!res.ok) {
          if (res.error === "email_not_configured") {
            setErrorMsg(`Odesílání e-mailu není na serveru nakonfigurováno. Napište nám na ${siteConfig.contactEmail}.`);
          } else {
            setErrorMsg("Odeslání se nepodařilo. Zkuste to znovu.");
          }
          setStatus("error");
          return;
        }
      } else {
        const res = await postLeadJson(base);
        if (!res.ok) {
          if (res.error === "email_not_configured") {
            setErrorMsg(`Odesílání e-mailu není na serveru nakonfigurováno. Napište nám na ${siteConfig.contactEmail}.`);
          } else if (res.error === "rate_limit") {
            setErrorMsg("Příliš mnoho pokusů. Zkuste to za chvíli.");
          } else if (res.error === "too_fast") {
            setErrorMsg("Zkuste formulář odeslat znovu za sekundu.");
          } else {
            setErrorMsg("Odeslání se nepodařilo. Zkuste to znovu.");
          }
          setStatus("error");
          return;
        }
      }

      setStatus("success");
      onSubmitSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch {
      setErrorMsg("Chyba spojení. Zkuste to znovu.");
      setStatus("error");
    }
  }

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-brand-navy"
          aria-label="Zavřít"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 id={titleId} className="pr-10 text-xl font-bold text-brand-navy">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>

      <div className="px-5 py-5 sm:px-6">
        {status === "success" ? (
          <div className="py-6 text-center" role="status" aria-live="polite">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-brand-navy">Děkujeme</p>
            <p className="mt-1 text-sm text-slate-600">
              Ozveme se s návrhem dalšího kroku — obvykle do jednoho pracovního dne. Výpočet byl orientační; konkrétní
              parametry doladíme spolu.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Chcete jen občas tip z praxe e-mailem?{" "}
              <Link href="/#newsletter-footer" className="font-semibold text-brand-navy hover:underline">
                Přihlášení k novinkám v patičce
              </Link>{" "}
              — oddělené od této poptávky.
            </p>
          </div>
        ) : (
          <form data-testid="calculator-lead-form" onSubmit={handleSubmit} className="space-y-4">
            <label className="sr-only" htmlFor="calc-lead-website-hp">
              Nepřepisujte
            </label>
            <input
              id="calc-lead-website-hp"
              type="text"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="absolute h-px w-px overflow-hidden opacity-0"
            />

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-800">
                Jméno a příjmení <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none ring-brand-cyan/0 transition focus:border-brand-cyan/50 focus:bg-white focus:ring-2 focus:ring-brand-cyan/30"
                placeholder="Jan Novák"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-800">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-cyan/50 focus:bg-white focus:ring-2 focus:ring-brand-cyan/30"
                placeholder="vas@email.cz"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-800">
                Telefon <span className="text-slate-400">(volitelně)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-cyan/50 focus:bg-white focus:ring-2 focus:ring-brand-cyan/30"
                placeholder="+420 …"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-800">
                Poznámka <span className="text-slate-400">(volitelně)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-cyan/50 focus:bg-white focus:ring-2 focus:ring-brand-cyan/30"
                placeholder="Krátce, s čím chcete pomoct…"
              />
            </div>

            {showAttachment ? (
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">
                  Příloha smlouvy <span className="text-slate-400">(PDF, obrázek)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-navy file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </div>
            ) : null}

            {errorMsg ? (
              <p className="text-sm text-red-600" role="alert">
                {errorMsg}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50 focus-visible:ring-offset-2 disabled:opacity-70"
            >
              {status === "loading" ? "Odesílám…" : cta.calculatorSubmit}
            </button>
            <p className="text-center text-[11px] text-slate-500">
              Odesláním souhlasíte se zpracováním údajů pro účel zpětného kontaktu.{" "}
              <Link href="/gdpr" className="text-brand-navy underline-offset-2 hover:underline">
                Podmínky
              </Link>
              .
            </p>
          </form>
        )}
      </div>
    </AppModal>
  );
}
