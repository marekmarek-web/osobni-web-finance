#!/usr/bin/env node
/**
 * Zapíše čerstvé sazby ze snímku (rates-snapshot.json) do stránky hypotecnikalkulacka/index.html.
 *
 * Pravidla:
 *  - Řádek, jehož sazba, RPSN i výše úvěru se nezměnily, jen dostane dnešní datum ověření
 *    (ručně psaný text s podmínkami zůstává beze změny).
 *  - Změní-li se sazba/RPSN/výše úvěru, řádek se přepíše textem příkladu z webu banky
 *    a objeví se ve výpisu "ZMĚNA" – ten je potřeba zkontrolovat (právní revize textu).
 *  - Řádky, které se dnes nepodařilo přečíst, zůstanou beze změny a vypíšou se jako "NEOVĚŘENO".
 *    U nich zůstává viditelné jejich původní datum a datum v poznámce pod tabulkou = nejstarší z řádků.
 *  - Řádky se řadí podle RPSN, nejlepší dostane třídu "best".
 *
 * Použití:  node scripts/rates/apply-to-html.mjs [--html cesta] [--snapshot cesta] [--dry]
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MAX_AGE_MS = 36 * 3_600_000;

const TILES = { "Hypotéka": "mortgage", "Půjčka na cokoliv": "loan", "Americká hypotéka": "american" };
const BANK_BY_ALT = (alt) => {
  const a = alt.toLowerCase();
  if (a.includes("čsob")) return "csob";
  if (a.includes("raiffeisen")) return "rb";
  if (a.includes("mbank")) return "mbank";
  if (a.includes("komerční")) return "kb";
  if (a.includes("unicredit")) return "ucb";
  if (a.includes("spořitelna")) return "cs";
  return null;
};
const DATE_RE = /\b(\d{1,2})\. (\d{1,2})\. (20\d\d)\b/g;

const czRate = (n) => n.toFixed(2).replace(".", ",") + " %";
const czInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ").replace(/ /g, " ");
const parseCz = (t) => Number(String(t).replace(/[^\d,.-]/g, "").replace(",", "."));
const pragueDate = (d) =>
  new Intl.DateTimeFormat("cs-CZ", { timeZone: "Europe/Prague", day: "numeric", month: "numeric", year: "numeric" })
    .format(d)
    .replace(/\s/g, " ")
    .replace(/\. /g, ". ");
const dateKey = (s) => {
  const m = /(\d{1,2})\. (\d{1,2})\. (20\d\d)/.exec(s);
  return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : 0;
};
const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hostOf = (u) => new URL(u).hostname.replace(/^www\./, "");

/** Textový obsah příkladu z <details>, bez značek. */
function exampleOf(li) {
  const m = /<details class="nb-rp">[\s\S]*?<p>([\s\S]*?)<\/p>/.exec(li);
  return m ? m[1] : "";
}

function amountOf(text) {
  const m = /(?:Úvěr|Půjčka[^:]*:|výše úvěru)\s*([\d ]{5,12})\s*Kč/i.exec(text.replace(/[  ]/g, " "));
  return m ? Number(m[1].replace(/\s/g, "")) : null;
}

/** Rozhodne, jestli se řádek proti snímku změnil. */
export function diffRow({ rate, apr, amount }, offer) {
  const sameRate = Math.abs(rate - offer.nominalRate) < 0.005;
  const sameApr = offer.apr == null || Math.abs(apr - offer.apr) < 0.005;
  const sameAmount = offer.amount == null || amount == null || offer.amount === amount;
  return !(sameRate && sameApr && sameAmount);
}

function rebuildRow(li, offer, todayStr, productType) {
  const isLoan = productType === "loan";
  const rateStr = czRate(offer.nominalRate);
  const aprStr = czRate(offer.apr);
  li = li
    .replace(/(<b data-l="(?:Sazba|Úrok)">)[^<]*(<\/b>)/, `$1${rateStr}$2`)
    .replace(/(<b data-l="RPSN">)[^<]*(<\/b>)/, `$1${aprStr}$2`)
    .replace(/data-rate="[^"]*"/, `data-rate="${offer.nominalRate}"`)
    .replace(/data-note="[^"]*"/, (m) => {
      const fix = offer.fixationYears ? `fixace ${offer.fixationYears} ${offer.fixationYears === 1 ? "rok" : offer.fixationYears < 5 ? "roky" : "let"}, ` : "";
      return `data-note="sazba z reprezentativního příkladu banky, ${isLoan ? "" : fix}RPSN ${aprStr}, web banky ${todayStr}"`;
    });
  if (!isLoan && offer.fixationYears) {
    const word = offer.fixationYears === 1 ? "rok" : offer.fixationYears < 5 ? "roky" : "let";
    if (/<small>[^<]*<\/small>/.test(li)) li = li.replace(/<small>[^<]*<\/small>/, `<small>fixace ${offer.fixationYears} ${word}</small>`);
  }
  const ex = escHtml(offer.example.replace(/\s+/g, " ").trim());
  const p = `<p>${ex} Zdroj: <a href="${offer.sourceUrl}" target="_blank" rel="noopener">${hostOf(offer.sourceUrl)}</a>, ${todayStr}.</p>`;
  return li.replace(/(<details class="nb-rp"><summary>[^<]*<\/summary>)<p>[\s\S]*?<\/p>(<\/details>)/, `$1${p}$2`);
}

export function applyToHtml(html, snapshot, now = new Date()) {
  const todayStr = pragueDate(now);
  const report = [];
  const offers = new Map(
    snapshot.offers
      .filter((o) => now - Date.parse(o.fetchedAt) <= MAX_AGE_MS && o.apr != null)
      .map((o) => [`${o.bankId}:${o.productType}`, o]),
  );

  const out = html.replace(
    /(<h3>(Hypotéka|Půjčka na cokoliv|Americká hypotéka)<\/h3>[\s\S]*?<ol class="nb-list">)([\s\S]*?)(<\/ol>)([\s\S]*?<span data-k="\d+">)([\s\S]*?)(<\/span>)/g,
    (_all, head, tileName, listBody, ol, mid, fine, tail) => {
      const productType = TILES[tileName];
      const chunks = listBody.split("</li>").filter((c) => c.trim());
      const rows = chunks.map((chunk) => {
        let li = chunk + "</li>";
        const alt = /alt="([^"]+)"/.exec(li)?.[1] ?? "";
        const bankId = BANK_BY_ALT(alt);
        const rate = parseCz(/<b data-l="(?:Sazba|Úrok)">([^<]*)</.exec(li)?.[1]);
        const apr = parseCz(/<b data-l="RPSN">([^<]*)</.exec(li)?.[1]);
        const offer = bankId && offers.get(`${bankId}:${productType}`);
        let verified = null;
        if (offer) {
          const changed = diffRow({ rate, apr, amount: amountOf(exampleOf(li)) }, offer);
          if (changed) {
            li = rebuildRow(li, offer, todayStr, productType);
            report.push(`ZMĚNA      ${tileName} / ${alt}: ${czRate(rate)} / RPSN ${czRate(apr)} -> ${czRate(offer.nominalRate)} / RPSN ${czRate(offer.apr)} (zkontrolovat text příkladu)`);
          } else {
            li = li.replace(DATE_RE, todayStr);
            report.push(`ověřeno    ${tileName} / ${alt}: ${czRate(rate)} / RPSN ${czRate(apr)}`);
          }
          verified = todayStr;
        } else {
          report.push(`NEOVĚŘENO  ${tileName} / ${alt}: nepřečteno dnes, ponechána sazba ${czRate(rate)} / RPSN ${czRate(apr)} z ${[...exampleOf(li).matchAll(DATE_RE)].pop()?.[0] ?? "neznámého data"}`);
        }
        const rowDate = verified ?? ([...exampleOf(li).matchAll(DATE_RE)].pop()?.[0] ?? "");
        const aprNow = parseCz(/<b data-l="RPSN">([^<]*)</.exec(li)?.[1]);
        return { li, aprNow, rowDate };
      });

      rows.sort((a, b) => a.aprNow - b.aprNow);
      const body = rows
        .map((r, i) => r.li.replace(/^(\s*)<li(?: class="best")?>/, `$1<li${i === 0 ? ' class="best"' : ""}>`))
        .join("");
      const oldest = rows.map((r) => r.rowDate).filter(Boolean).sort((a, b) => dateKey(a) - dateKey(b))[0];
      const newFine = oldest ? fine.replace(/\bk (\d{1,2})\. (\d{1,2})\. (20\d\d)/, `k ${oldest}`) : fine;
      return `${head}${body}${ol}${mid}${newFine}${tail}`;
    },
  );
  return { html: out, report };
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (n, d) => (args.includes(n) ? resolve(args[args.indexOf(n) + 1]) : d);
  const htmlPath = arg("--html", resolve(HERE, "../../hypotecnikalkulacka/index.html"));
  const snapPath = arg("--snapshot", resolve(HERE, "rates-snapshot.json"));
  const html = await readFile(htmlPath, "utf8");
  const snapshot = JSON.parse(await readFile(snapPath, "utf8"));
  const { html: out, report } = applyToHtml(html, snapshot);
  console.log(report.join("\n"));
  if (out === html) console.log("\nBeze změny stránky.");
  else if (args.includes("--dry")) console.log("\n(--dry) stránka nepřepsána.");
  else {
    await writeFile(htmlPath, out, "utf8");
    console.log("\nStránka hypotecnikalkulacka/index.html aktualizována.");
  }
  process.exit(report.some((r) => r.startsWith("NEOVĚŘENO")) ? 2 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
