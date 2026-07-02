export const CONSENT_STORAGE_KEY = "pb_consent_v1";

export type ConsentState = {
  v: 1;
  analytics: boolean;
  updatedAt: string;
};

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as ConsentState;
    if (o?.v !== 1 || typeof o.analytics !== "boolean") return null;
    return o;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): void {
  const state: ConsentState = {
    v: 1,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
}

export function hasConsentDecision(): boolean {
  return readConsent() != null;
}

export function analyticsAllowed(): boolean {
  return readConsent()?.analytics === true;
}
