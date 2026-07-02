import { NextRequest, NextResponse } from "next/server";

type LegacyReq = {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  url: string;
};

type LegacyRes = {
  status: (code: number) => LegacyRes;
  setHeader: (key: string, value: string) => LegacyRes;
  json: (data: unknown) => NextResponse;
  end: (data?: string) => NextResponse;
};

export type LegacyHandler = (req: LegacyReq, res: LegacyRes) => Promise<NextResponse | void>;

export async function runLegacyHandler(
  handler: LegacyHandler,
  request: NextRequest,
): Promise<NextResponse> {
  const url = new URL(request.url);
  let body: unknown = undefined;

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }
  }

  const req: LegacyReq = {
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    url: url.pathname + url.search,
  };

  let statusCode = 200;
  const headers = new Headers();
  let ended = false;

  const res: LegacyRes = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    setHeader(key: string, value: string) {
      headers.set(key, value);
      return this;
    },
    json(data: unknown) {
      ended = true;
      headers.set("Content-Type", "application/json");
      return NextResponse.json(data, { status: statusCode, headers });
    },
    end(data?: string) {
      ended = true;
      return new NextResponse(data ?? null, { status: statusCode, headers });
    },
  };

  const result = await handler(req, res);
  if (result instanceof NextResponse) return result;
  if (ended) {
    return new NextResponse(null, { status: statusCode, headers });
  }

  return NextResponse.json({ error: "Legacy handler did not respond" }, { status: 500 });
}
