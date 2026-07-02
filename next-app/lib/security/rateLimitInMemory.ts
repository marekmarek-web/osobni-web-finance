/**
 * Jednoduchý in-memory rate limit (per běžící Node proces).
 * Na serverless více instancí = limit není globální — stále omezuje burst z jedné IP na instanci.
 */

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function createIpRateLimiter(opts: { windowMs: number; maxPerWindow: number }) {
  const buckets = new Map<string, number[]>();

  return function check(ip: string): RateLimitResult {
    const now = Date.now();
    const arr = (buckets.get(ip) ?? []).filter((t) => now - t < opts.windowMs);
    if (arr.length >= opts.maxPerWindow) {
      const oldest = arr[0] ?? now;
      const retryAfterMs = opts.windowMs - (now - oldest);
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }
    arr.push(now);
    buckets.set(ip, arr);
    return { ok: true };
  };
}

export function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
