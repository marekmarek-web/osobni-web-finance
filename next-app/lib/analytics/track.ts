"use client";

import { analyticsAllowed } from "@/lib/consent/storage";

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

function getPlausible(): PlausibleFn | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { plausible?: PlausibleFn }).plausible;
}

const recent = new Map<string, number>();
const DEDUPE_MS = 1800;

function dedupeKey(event: string, props?: Record<string, string | number | boolean>): string {
  const p = props
    ? Object.entries(props)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${String(v)}`)
        .join("&")
    : "";
  return `${event}|${p}`;
}

/**
 * Měření pouze po souhlasu s analytikou (Plausible). Bez souhlasu no-op.
 * Nepředávejte PII (e-maily, telefony, celá jména).
 * Krátké deduplikace stejného eventu+props (např. React Strict Mode).
 */
export function track(event: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  if (!analyticsAllowed()) return;
  const key = dedupeKey(event, props);
  const now = Date.now();
  const prev = recent.get(key);
  if (prev != null && now - prev < DEDUPE_MS) return;
  recent.set(key, now);

  const plausible = getPlausible();
  if (!plausible) return;
  const safeProps = props
    ? Object.fromEntries(
        Object.entries(props).map(([k, v]) => [k, typeof v === "string" ? scrub(v) : v]),
      )
    : undefined;
  try {
    plausible(event, safeProps ? { props: safeProps } : undefined);
  } catch {
    /* ignore */
  }
}

function scrub(s: string): string {
  return s.length > 120 ? `${s.slice(0, 120)}…` : s;
}

/** Volání po navigaci (App Router) — pageview pro Plausible. */
export function trackPageview(path?: string): void {
  if (!analyticsAllowed()) return;
  const plausible = getPlausible();
  if (!plausible) return;
  try {
    plausible("pageview", path ? { props: { path: scrub(path) } } : undefined);
  } catch {
    /* ignore */
  }
}
