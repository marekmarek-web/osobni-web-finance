import { NextResponse } from "next/server";
import { getLoanRates, getMortgageRates } from "@/lib/calculators/mortgage/rates";
import { createIpRateLimiter, getClientIp } from "@/lib/security/rateLimitInMemory";

export const dynamic = "force-dynamic";

/** Omezí scrape veřejného endpointu (stále best-effort na serverless). */
const checkRate = createIpRateLimiter({ windowMs: 60_000, maxPerWindow: 90 });

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRate(ip);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  const rates = type === "loan" ? await getLoanRates() : await getMortgageRates();

  return NextResponse.json(
    {
      ok: true,
      rates,
      type: type === "loan" ? "loan" : "mortgage",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
