export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { createRequire } from "node:module";
import { runLegacyHandler } from "@/lib/legacy-api-adapter";

const require = createRequire(import.meta.url);
const handler = require("../../../legacy-api/send-report.js") as (
  req: unknown,
  res: unknown,
) => Promise<void>;

async function handle(request: NextRequest) {
  return runLegacyHandler(handler, request);
}

export const POST = handle;
export const OPTIONS = handle;
