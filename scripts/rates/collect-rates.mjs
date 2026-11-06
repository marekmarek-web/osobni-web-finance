#!/usr/bin/env node
/**
 * Denní sběr sazeb bank z oficiálních stránek (reprezentativní příklady).
 *
 * Spuštění:  node scripts/rates/collect-rates.mjs [--out cesta.json] [--only csob:mortgage]
 * Výstup:    scripts/rates/rates-snapshot.json (do webu ho přepíše apply-to-html.mjs)
 *
 * Pravidla (obchodní):
 *  - Sazba se NIKDY nevymýšlí. Co se nepodaří přečíst, zůstane s původním časem
 *    posledního úspěšného čtení a čtečka v aplikaci ji po 48 h přestane zobrazovat.
 *  - Každá sazba nese doslovný text příkladu banky, zdrojovou adresu a čas čtení.
 *  - Exit code 1, pokud některý zdroj selhal -> GitHub Actions upozorní e-mailem.
 */
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = resolve(HERE, "rates-snapshot.json");

/** Zdroje: jedna oficiální stránka banky = jedna sazba. Kotva = text, od kterého se čte příklad. */
export const SOURCES = [
  // --- Půjčky na cokoliv ---
  { bankId: "mbank", productType: "loan", url: "https://www.mbank.cz/osobni/uvery/mpujcka/", anchor: /Reprezentativní příklad:\s*Výše úvěru/i },
  { bankId: "rb", productType: "loan", url: "https://www.rb.cz/osobni/pujcky/minutova-pujcka", anchor: /Reprezentativní příklad\s*Výše půjčky/i },
  { bankId: "kb", productType: "loan", url: "https://www.kb.cz/cs/obcane/pujcky/osobni-pujcka", anchor: /Reprezentativní příklad:\s*Výše úvěru/i },
  { bankId: "cs", productType: "loan", url: "https://www.csas.cz/cs/osobni-finance/pujcky/pujcka", anchor: /Reprezentativní příklad:\s*Úvěr ve výši/i },
  { bankId: "ucb", productType: "loan", url: "https://www.unicreditbank.cz/cs/obcane/pujcky/kalkulacka-uveru-presto-na-cokoliv.html", anchor: /Reprezentativní příklad\s*Když si půjčíte/i },
  { bankId: "csob", productType: "loan", url: "https://www.csob.cz/lide/pujcky/pujcka-na-cokoliv", anchor: /Vzorový příklad pro online půjčku/i },
  // --- Hypotéky ---
  { bankId: "mbank", productType: "mortgage", url: "https://www.mbank.cz/osobni/hypoteky/hypoteka-na-bydleni/", anchor: /Reprezentativní příklad hypotéky ve výši/i },
  { bankId: "cs", productType: "mortgage", url: "https://www.csas.cz/cs/osobni-finance/hypoteky/hypoteka", anchor: /Celková výše úvěru [\d  ]+ Kč, výše jednotlivých měsíčních splátek [\d  ]+ Kč \(splátky zahrnují jistinu a úrok\)/i, waitMs: 9000 },
  { bankId: "ucb", productType: "mortgage", url: "https://www.unicreditbank.cz/cs/obcane/hypoteky/hypoteka-nove-penize.html", anchor: /Reprezentativní příklad:\s*Celková výše úvěru/i },
  // ČSOB: oficiální stránka s reprezentativními příklady (klasická i americká hypotéka).
  { bankId: "csob", productType: "mortgage", url: "https://www.csob.cz/lide/bydleni/hypoteka/reprezentativni-priklad", anchor: /Reprezentativní příklad Pro Hypotéku Poskytovatelem/i },
  { bankId: "rb", productType: "mortgage", url: "https://www.rb.cz/promo/hypodny", anchor: /Pro názornost uvádíme reprezentativní příklad:\s*Výše úvěru/i },
  // KB: kalkulačka na stránce hypotéky ukazuje 0,00 % -> zatím nečteno (zůstává ručně).
  { bankId: "kb", productType: "mortgage", url: "https://www.kb.cz/cs/obcane/pujcky/hypoteka", anchor: /Reprezentativní příklad/i, optional: true },
  // --- Americká hypotéka ---
  { bankId: "csob", productType: "american", url: "https://www.csob.cz/lide/bydleni/hypoteka/reprezentativni-priklad", anchor: /Reprezentativní příklad Pro Americkou hypotéku Poskytovatelem/i },
  { bankId: "mbank", productType: "american", url: "https://www.mbank.cz/osobni/hypoteky/americka-hypoteka/", anchor: /Reprezentativní příklad/i, optional: true },
  { bankId: "kb", productType: "american", url: "https://www.kb.cz/cs/obcane/pujcky/hypoteky/americka-hypoteka", anchor: /(?:Reprezentativní|Vzorový) příklad/i, optional: true },
  { bankId: "cs", productType: "american", url: "https://www.csas.cz/cs/osobni-finance/hypoteky/americka-hypoteka", anchor: /reprezentativní příklad/i, waitMs: 9000, optional: true },
];

const NUM = "(\\d{1,2}[,.]\\d{1,2})";
const toNum = (s) => Number(String(s).replace(",", "."));

/** Čistá funkce: z textu stránky vytáhne sazbu, RPSN a doprovodné údaje. Testovatelná bez prohlížeče. */
export function extractOffer(pageText, anchor) {
  const text = pageText.replace(/[  ]/g, " ").replace(/\s+/g, " ");
  const m = anchor.exec(text);
  if (!m) return { ok: false, reason: "kotva příkladu na stránce nenalezena" };
  const win = text.slice(m.index, m.index + 900);

  const nomM = new RegExp(`(?:sazb[a-zěéíyů]*|úrok\\w*)[^%]{0,80}?${NUM}\\s*%`, "i").exec(win);
  const aprM = new RegExp(`(?:RPSN|roční procentní sazb\\w* nákladů)[^%]{0,80}?${NUM}\\s*%`, "i").exec(win);
  if (!nomM) return { ok: false, reason: "v příkladu chybí úroková sazba" };
  if (!aprM) return { ok: false, reason: "v příkladu chybí RPSN" };

  const nominalRate = toNum(nomM[1]);
  const apr = toNum(aprM[1]);
  const amountM = /(?:výše (?:úvěru|půjčky)|ve výši|půjčíte si)\s*([\d ]{5,12})\s*Kč/i.exec(win);
  const fixM = /(?:fixov\w*|fixace)[^.]{0,30}?(\d{1,2})\s*(?:let|rok|roky)/i.exec(win) ?? /na\s*(\d{1,2})\s*(?:let|rok|roky)\s*(?:pevn|fix)/i.exec(win);
  const dateM = /(\d{1,2})\.\s?(\d{1,2})\.\s?(20\d\d)/.exec(win);

  // Hrubá kontrola rozumnosti – nesmyslná čísla se nikdy nepublikují.
  if (!(nominalRate >= 1 && nominalRate <= 20)) return { ok: false, reason: `nerozumná sazba ${nominalRate} %` };
  if (!(apr >= nominalRate - 0.01 && apr <= nominalRate + 3)) return { ok: false, reason: `RPSN ${apr} % nesedí k sazbě ${nominalRate} %` };

  return {
    ok: true,
    nominalRate,
    apr,
    amount: amountM ? Number(amountM[1].replace(/\s/g, "")) : null,
    fixationYears: fixM ? Number(fixM[1]) : null,
    exampleDate: dateM ? `${dateM[3]}-${dateM[2].padStart(2, "0")}-${dateM[1].padStart(2, "0")}` : null,
    example: win.slice(0, 520).replace(/\s+\S*$/, "").trim(),
  };
}

/** Sazba přímo z kalkulačky banky (bez RPSN) + věta s podmínkami. Čistá funkce. */
export function extractCalcOffer(pageText, src) {
  const text = pageText.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ");
  const m = src.calcRe.exec(text);
  if (!m) return { ok: false, reason: "sazba v kalkulačce nenalezena" };
  const nominalRate = toNum(m[1]);
  if (!(nominalRate >= 1 && nominalRate <= 20)) return { ok: false, reason: `nerozumná sazba ${nominalRate} %` };
  const note = src.noteRe ? src.noteRe.exec(text)?.[0] : null;
  if (src.noteRe && !note) return { ok: false, reason: "chybí věta s podmínkami sazby (banka mohla změnit stránku)" };
  return { ok: true, nominalRate, apr: null, amount: null, fixationYears: src.fixationYears ?? null, exampleDate: null,
    example: `Sazba z kalkulačky banky (fixace ${src.fixationYears} roky). ${note ?? ""}`.trim() };
}

async function readPage(browser, src) {
  const ctx = await browser.newContext({
    locale: "cs-CZ",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(src.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(src.waitMs ?? 5000);
    // Nepovinné cookies vždy odmítnout (lišta jinak zakrývá stránku).
    await page.getByRole("button", { name: /(použít )?jen (technické|nezbytné)|odmítnout|pouze nezbytné/i }).first().click({ timeout: 1500 }).catch(() => {});
    if (src.clickText) {
      await page.getByText(src.clickText, { exact: false }).first().click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
    // textContent bez <script>/<style>: zahrne i skryté popupy (např. mBank).
    return await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll("script,style,noscript").forEach((n) => n.remove());
      return clone.textContent || "";
    });
  } finally {
    await ctx.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const out = args.includes("--out") ? resolve(args[args.indexOf("--out") + 1]) : DEFAULT_OUT;
  const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

  let previous = { offers: [] };
  try {
    previous = JSON.parse(await readFile(out, "utf8"));
  } catch {
    /* první běh */
  }
  const prevByKey = new Map(previous.offers.map((o) => [`${o.bankId}:${o.productType}`, o]));

  // UniCredit (a další) blokuje "headless" prohlížeč, proto běží skutečný Chrome s okny (v CI přes xvfb).
  const browser = await chromium
    .launch({ channel: "chrome", headless: false })
    .catch(() => chromium.launch({ headless: false }));

  // Ladicí režim: node collect-rates.mjs --dump ucb:loan  -> vypíše okolí slov "příklad"/"RPSN" ze stránky.
  if (args.includes("--dump")) {
    const key = args[args.indexOf("--dump") + 1];
    const src = SOURCES.find((s) => `${s.bankId}:${s.productType}` === key);
    const t = (await readPage(browser, src)).replace(/[  ]/g, " ").replace(/\s+/g, " ");
    console.log(`délka textu: ${t.length}`);
    for (const m of t.matchAll(/(příklad|RPSN|roční procentní sazb)/gi)) console.log("…" + t.slice(Math.max(0, m.index - 120), m.index + 260) + "…\n");
    await browser.close();
    return;
  }
  const now = new Date().toISOString();
  const offers = new Map(prevByKey);
  const failures = [];
  const warnings = [];

  for (const src of SOURCES) {
    const key = `${src.bankId}:${src.productType}`;
    if (only && only !== key) continue;
    try {
      const pageText = await readPage(browser, src);
      const res = src.mode === "calc" ? extractCalcOffer(pageText, src) : extractOffer(pageText, src.anchor);
      if (!res.ok) throw new Error(res.reason);
      const prev = prevByKey.get(key);
      if (prev && Math.abs(prev.nominalRate - res.nominalRate) >= 1.5) {
        warnings.push(`${key}: skok sazby ${prev.nominalRate} % -> ${res.nominalRate} %, zkontrolovat ručně`);
      }
      offers.set(key, {
        bankId: src.bankId,
        productType: src.productType,
        nominalRate: res.nominalRate,
        apr: res.apr,
        amount: res.amount,
        fixationYears: res.fixationYears,
        exampleDate: res.exampleDate,
        example: res.example,
        sourceUrl: src.url,
        fetchedAt: now,
      });
      console.log(`OK    ${key}  ${res.nominalRate} % / RPSN ${res.apr} %`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ key, reason, optional: Boolean(src.optional), at: now });
      console.log(`CHYBA ${key}  ${reason}${src.optional ? " (zdroj zatím nepodporován)" : ""}`);
    }
  }
  await browser.close();

  const snapshot = {
    schemaVersion: 1,
    generatedAt: now,
    maxAgeHours: 48,
    offers: [...offers.values()].sort((a, b) => a.productType.localeCompare(b.productType) || a.bankId.localeCompare(b.bankId)),
    failures,
    warnings,
  };
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(snapshot, null, 2) + "\n", "utf8");

  const hard = failures.filter((f) => !f.optional);
  console.log(`\nHotovo: ${snapshot.offers.length} sazeb, ${hard.length} chyb, ${warnings.length} upozornění.`);
  process.exit(hard.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
