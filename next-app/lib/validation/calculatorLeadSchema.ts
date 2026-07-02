import { z } from "zod";

export const calculatorTypeSchema = z.enum(["pension", "life", "mortgage", "investment"]);

export const leadSourceSchema = z.enum([
  "calculator",
  "footer_quick",
  "homepage_consultation",
  "contact_page",
  /** CTA z článku / blogu — mapuje se na source_type article. */
  "article_cta",
]);

export const lifeIntentSchema = z.enum(["general", "proposal", "check"]);

/** JSON body pro POST /api/leads — jednotný model pro všechny veřejné formuláře. */
export const calculatorLeadBodySchema = z
  .object({
    source: leadSourceSchema,
    calculatorType: calculatorTypeSchema.optional(),
    lifeIntent: lifeIntentSchema.optional(),
    name: z.string().trim().min(1, "Vyplňte jméno.").max(120),
    /** Prázdné povoleno u telefon-only kontaktu (kontaktní stránka). */
    email: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v === undefined ? "" : v)),
    phone: z.string().trim().max(40).optional(),
    note: z.string().trim().max(4000).optional(),
    sourcePath: z.string().max(500).optional(),
    resultSummary: z.string().max(8000).optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    companyWebsite: z.string().max(120).optional(),
    formOpenedAt: z.number().optional(),
    interest: z.string().max(80).optional(),
    topic: z.string().max(80).optional(),
    consent: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const em = data.email.trim();
    const emailValid = em.length > 0 && z.string().email().safeParse(em).success;
    const phoneDigits = (data.phone ?? "").replace(/\D/g, "").length;
    const phoneValid = phoneDigits >= 9;
    if (!emailValid && !phoneValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vyplňte platný e-mail nebo telefon (min. 9 číslic).",
        path: em.length ? ["email"] : ["phone"],
      });
    }
    if (data.metadata && Object.keys(data.metadata).length > 25) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Příliš mnoho položek v metadatech.",
        path: ["metadata"],
      });
    }
  });

export type CalculatorLeadBody = z.infer<typeof calculatorLeadBodySchema>;
