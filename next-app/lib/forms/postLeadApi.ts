"use client";

import { getAttributionMetadataStrings } from "@/lib/analytics/attribution";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { isPublicApiOk, publicApiErrorCode } from "@/lib/forms/public-json";
import type { CalculatorLeadBody } from "@/lib/validation/calculatorLeadSchema";

export type PostLeadResult =
  | { ok: true; leadId?: string | null }
  | { ok: false; error: string; message?: string };

type LeadApiJson = { ok?: boolean; leadId?: string | null; error?: string };

function mergeAttribution(body: CalculatorLeadBody): CalculatorLeadBody {
  const attr = getAttributionMetadataStrings();
  if (Object.keys(attr).length === 0) return body;
  return {
    ...body,
    metadata: { ...attr, ...(body.metadata ?? {}) },
  };
}

export async function postLeadJson(body: CalculatorLeadBody): Promise<PostLeadResult> {
  const merged = mergeAttribution(body);
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(merged),
  });
  const data = (await res.json().catch(() => ({}))) as LeadApiJson;

  if (res.ok && isPublicApiOk(data)) {
    track(AnalyticsEvents.leadSubmitSuccess, {
      source: String(merged.source).slice(0, 48),
      calc: merged.calculatorType ? String(merged.calculatorType).slice(0, 24) : "none",
    });
    return { ok: true, leadId: data.leadId ?? null };
  }

  const code = publicApiErrorCode(data);
  track(AnalyticsEvents.leadSubmitError, { source: String(merged.source).slice(0, 48), error: code.slice(0, 40) });
  return { ok: false, error: code };
}

export async function postLeadFormData(fd: FormData): Promise<PostLeadResult> {
  const res = await fetch("/api/leads", {
    method: "POST",
    body: fd,
  });
  const data = (await res.json().catch(() => ({}))) as LeadApiJson;

  if (res.ok && isPublicApiOk(data)) {
    const src = String(fd.get("source") ?? "calculator").slice(0, 48);
    const calc = String(fd.get("calculatorType") ?? "").slice(0, 24);
    track(AnalyticsEvents.leadSubmitSuccess, { source: src, calc: calc || "form" });
    return { ok: true, leadId: data.leadId ?? null };
  }

  const code = publicApiErrorCode(data);
  track(AnalyticsEvents.leadSubmitError, { source: "multipart", error: code.slice(0, 40) });
  return { ok: false, error: code };
}
