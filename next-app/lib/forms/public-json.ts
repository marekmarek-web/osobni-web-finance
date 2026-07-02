/**
 * Společné parsování odpovědí veřejných JSON API (`/api/leads`, `/api/subscribers`, …).
 */

export type PublicApiEnvelope = {
  ok?: boolean;
  error?: string;
};

/** `res.ok` + JSON tělo s `ok: true` (veřejné lead/subscriber API). */
export function isPublicApiOk(data: unknown): boolean {
  return Boolean(
    data && typeof data === "object" && "ok" in data && (data as PublicApiEnvelope).ok === true,
  );
}

export function publicApiErrorCode(data: unknown): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as PublicApiEnvelope).error;
    if (typeof e === "string" && e.length) return e;
  }
  return "send_failed";
}
