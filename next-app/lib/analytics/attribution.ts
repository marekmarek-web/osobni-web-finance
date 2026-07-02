const STORAGE_KEY = "pb_attr_v1";

type StoredAttr = {
  landing_path: string;
  captured_at: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

/** Jednou za session uloží landing + UTM z aktuální URL (první hit). */
export function captureSessionAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const path = window.location.pathname.slice(0, 200);
    const sp = new URLSearchParams(window.location.search);
    const row: StoredAttr = {
      landing_path: path,
      captured_at: Date.now(),
    };
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
      const v = sp.get(k)?.trim();
      if (v) row[k] = v.slice(0, 120);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(row));
  } catch {
    /* quota / private mode */
  }
}

/** Sloučení do metadata leadu (max klíčů hlídá Zod). */
export function getAttributionMetadataStrings(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as StoredAttr;
    const out: Record<string, string> = {};
    if (o.landing_path) out.landing_path = o.landing_path;
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
      const v = o[k];
      if (v) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}
