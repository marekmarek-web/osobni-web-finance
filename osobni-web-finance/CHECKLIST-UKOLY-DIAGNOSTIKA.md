# Checklist úkolů – Diagnostika jednatele

Přehled toho, co bylo upraveno a co zůstává na později.

---

## Hotovo (upraveno)

- [x] **Leady a assessment ukládání** – Při „Generovat PDF“ / „Pokračovat na diagnostiku“ se ukládá lead do `leads` a assessment do `assessments` (včetně `input_json`, `output_json`).
- [x] **Všechny vyplněné údaje v Supabase** – Do `assessments.input_json` se ukládá celý objekt: `company`, `lead`, `benefits`, `risks`, `assets`, `director`. V Supabase → Table Editor → tabulka `assessments` → u řádku rozklikni sloupec **input_json** a uvidíš všechny částky, zaškrtnutí a texty.
- [x] **Email bez backendu** – Tlačítko „Poslat výsledek na email“ ukládá lead do Supabase a otevírá mailto klientovi. **Doplněno:** odeslání kopie na **kontakt@marek-marek.cz** přes **FormSubmit.co** (fetch na jejich endpoint), takže ty jako poradce dostaneš e-mail s údaji o leadovi a shrnutím.
- [x] **Kontaktní e-mail** – Do odesílání je nastaven **kontakt@marek-marek.cz** (FormSubmit.co první odeslání může vyžadovat potvrzení e-mailu v doručené poště).

---

## Částečně / k další úpravě

- [ ] **Formulář obsáhlejší jako fa-sro-main**
  - **Benefity:** Zaškrtávat zvlášť DPS, DIP, IŽP (ne jen „mají benefity“). Pole: příspěvek na osobu/měs, kolika zaměstnancům, příspěvky jednatelům měsíčně. **Kritická chyba:** „Jednatel si to platí ze mzdy?“ → pokud ano, upozornit, že to může platit firma (daňová optimalizace).
  - **Výhody benefitů pro zaměstnance** – krátký popis / kalkulačka (jako v fa-sro-main).
  - **Pojištění firmy:** Co je pojištěné – majetek, přerušení provozu, odpovědnost, D&O, flotila, kyber. U každého případně **pojistný limit (Kč)** a **stáří smlouvy (roky)**. Zobrazení v Supabase v `input_json`.
  - **Pojištění jednatele:** Rozšířit podle FP-final (smrt, invalidita, PN, doporučené zajištění). Ve výstupu zobrazit jen např. **% a blurred** (ne všechny konkrétní částky), aby know-how zůstalo „na call“.

- [ ] **PDF výstup**
  - Hlavně **prodávat myšlenku**: „Něco je špatně, víme co, ale ne jak to vyřešit → já jsem řešení.“
  - Kratší než FP-final, ale působivější – kritické mezery, dopad na firmu/riziko, CTA = konzultace.
  - Jednatel: např. procenta a rozostřené hodnoty (blurred), ne kompletní návod.

- [ ] **Jak to posílat mailem** – Nyní: mailto klientovi + FormSubmit.co na kontakt@marek-marek.cz (bez nutnosti zadávat tvůj mail ve formuláři). Pokud budeš chtít plně automatické posílání klientovi (bez otevření mailto), bude potřeba backend (Vercel API + Resend/SendGrid) nebo jiná e-mailová služba s API.

---

## Shrnutí

| Úkol | Stav |
|------|------|
| Leady + data firmy/benefity/pojištění v Supabase | Hotovo – ukládá se do `leads` + `assessments.input_json` |
| Email na kontakt@marek-marek.cz | Hotovo – přes FormSubmit.co (fetch) |
| Formulář rozšířen (DPS/DIP/IŽP, jednatel ze mzdy, pojištění firmy – limity, D&O) | K doplnění |
| PDF výstup prodejní, kratší, kritické + „já jsem řešení“ | K doplnění |
| Jednatel ve výstupu: % a blurred | K doplnění |

Soubor `diagnostika-jednatel-standalone.html` teď odesílá při „Poslat výsledek na email“ (bez API_BASE) i request na FormSubmit.co, takže ty dostaneš e-mail na **kontakt@marek-marek.cz**.
