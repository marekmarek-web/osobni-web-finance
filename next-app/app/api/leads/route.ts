import { NextResponse } from "next/server";
import { calculatorLeadBodySchema } from "@/lib/validation/calculatorLeadSchema";

export const dynamic = "force-dynamic";

const FORMSUBMIT_URL = "https://formsubmit.co/ajax/kontakt@marek-marek.cz";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      const fd = await request.formData();
      body = Object.fromEntries(fd.entries());
    } else {
      body = (await request.json()) as Record<string, unknown>;
    }

    const parsed = calculatorLeadBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "validation", message: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.companyWebsite?.trim()) {
      return NextResponse.json({ ok: true, leadId: null });
    }

    const payload: Record<string, string> = {
      _subject: `Lead kalkulačka: ${data.calculatorType ?? data.source}`,
      _captcha: "false",
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      source: data.source,
      calculatorType: data.calculatorType ?? "",
      resultSummary: data.resultSummary ?? "",
      sourcePath: data.sourcePath ?? "",
      note: data.note ?? "",
    };

    if (data.metadata) {
      for (const [k, v] of Object.entries(data.metadata)) {
        payload[`meta_${k}`] = v;
      }
    }

    const res = await fetch(FORMSUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, leadId: null });
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
