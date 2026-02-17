# FP pro poradce – plán a proces

Tento dokument popisuje, jak z „FP pro ostatní.html“ udělat nástroj pro poradce s přihlášením, vlastním brandingem a možností vložení na vlastní web.

---

## 1. Doména pro produkt – doporučení: vlastní

Aby produkt působil **sofistikovaně a nebyl pod tvým jménem**, je vhodné koupit **vlastní doménu** pro tento nástroj (např. **fp-poradci.cz**). Poradci pak přistupují na neutrální adresu, ne na marek-marek.cz.

| Varianta | Příklad | Kdy použít |
|----------|---------|------------|
| **Vlastní doména produktu** | `fp-poradci.cz` | **Doporučeno.** Samostatná značka, profesionální dojem, ne pod tvým jménem. Viz **DOMENA-PRODUKTU-FP-PORADCE.md**. |
| **Cesta na tvé doméně** | `www.marek-marek.cz/fp-poradce/` | Pro rychlý start nebo test; později můžeš přepnout na vlastní doménu. |
| **Subdoména** | `fp.marek-marek.cz` | Kompromis – oddělený produkt, stále tvoje doména. |

**Doporučení:** Pořiď si doménu typu **fp-poradci.cz**, přidej ji v Vercel (Settings → Domains) a nasměruj na ni stejnou aplikaci. Technicky jedna aplikace, jen jiná adresa. Podrobně: **DOMENA-PRODUKTU-FP-PORADCE.md**.

---

## 2. Jak to celé funguje (proces)

1. **Ty (provozovatel)** máš jednu aplikaci – „FP pro ostatní“ s rozšířením pro poradce.
2. **Poradce** se zaregistruje / přihlásí (e-mail + heslo, přes Supabase Auth).
3. Po přihlášení má **vlastní nastavení**: logo, jméno/firma, barvy, kontakt (footer, CTA).
4. Aplikace podle **přihlášeného uživatele** načte jeho branding a zobrazí wizard s jeho vizuálem.
5. **Vložení na vlastní web:** Poradce na svůj web vloží odkaz nebo iframe, např.:
   - Odkaz: `https://fp-poradci.cz/fp-poradce/` (po přihlášení už je branding jeho). Při použití vlastní domény produktu.
   - Embed: `https://fp-poradci.cz/fp-poradce/?embed=1` v iframe – na doméně produktu, vizuálně jeho branding.

Žádná nová doména pro každého poradce – všichni používají tvoji aplikaci, každý vidí svůj vzhled a své údaje.

---

## 3. Co technicky potřebuješ

### 3.1 Backend (Supabase – už ho máš)

- **Supabase Auth** – přihlášení / registrace poradců (e-mail + heslo).
- **Nová tabulka `advisors`** (nebo `poradci`) – u každého poradce:
  - `id` (UUID), `email`, propojení na Auth
  - `slug` (jedinečný, např. `jan-novak`) – pro hezké URL a embed
  - `display_name` (např. „Jan Novák“)
  - `company_name` (volitelně)
  - `logo_url` (odkaz na logo)
  - `tagline` (např. „Finanční partner“)
  - Barvy: `primary_color`, `accent_color` (hex)
  - Kontakt: `website`, `phone`, `email_contact`, sociální sítě
  - `embed_allowed` (boolean) – zda smí vložit na svůj web

### 3.2 Frontend (FP pro ostatní.html)

- **Stránka přihlášení** – formulář Login / Registrace (může být samostatná stránka nebo modal).
- **Načtení brandingu** – po přihlášení (nebo z URL parametru `?poradce=slug` v režimu embed) se stáhnou data poradce a aplikují se:
  - do hlavičky (logo, jméno, tagline),
  - do footeru (jméno, kontakty, odkazy),
  - na barvy (CSS proměnné `--color-accent`, `--color-bg` atd.).
- **Režim embed** – pokud je `?embed=1`, skrýt hlavní menu / zjednodušit navigaci, aby to vypadalo jako součást cizího webu.

### 3.3 Hosting a doména

- Hosting: Vercel (už máš), stejná aplikace.
- **Doména:** Doporučená je vlastní doména produktu (např. **fp-poradci.cz**), aby produkt nebyl pod tvým jménem. Přidáš ji v Vercel → Domains a nastavíš DNS. Alternativa: `www.marek-marek.cz/fp-poradce/` pro start.

---

## 4. Kroky implementace (po pořadí)

1. **Supabase:** Vytvořit tabulku `advisors` a propojit ji s Auth (policy: poradce vidí jen svůj záznam).
2. **Supabase Auth:** Zapnout e-mail/heslo, (volitelně) přidat registrační stránku pro poradce.
3. **Konfigurace brandingu:** V `FP pro ostatní.html` na začátku (nebo v samostatném `fp-poradce-config.js`) načíst buď:
   - z přihlášení (session → advisor_id → data z `advisors`), nebo
   - z URL `?poradce=slug` (pro veřejný odkaz / embed bez nutnosti přihlášení klienta).
4. **Aplikace brandingu:** Funkce, která nastaví logo, texty v headeru/footeru a CSS proměnné podle objektu z `advisors`.
5. **Přihlašovací stránka:** Jednoduchá stránka (nebo sekce) Login / Registrace, po úspěchu přesměrování na wizard s jeho brandingem.
6. **Embed režim:** Detekce `?embed=1`, úprava layoutu (např. skrytí hlavní navigace), aby iframe na cizím webu vypadal čistě.

Až to budeš chtít rozšířit o ukládání plánů „pod poradce“ nebo reporty s jeho brandingem, přidáš další tabulky (např. `fp_plans` s `advisor_id`) a API/Edge Functions podle potřeby.

---

## 5. Shrnutí

- **Nová www doména** – **nepotřebuješ**. Stačí jedna aplikace na jedné doméně (cesta nebo subdoména).
- **Proces:** Přihlášení poradce → načtení jeho záznamu z `advisors` → aplikace brandingu ve wizardu → poradce může sdílet odkaz nebo vložit iframe na svůj web.
- **Proveditelnost:** Je to standardní multi-tenant aplikace (jeden kód, více „tenantů“ = poradců). Supabase Auth + jedna tabulka `advisors` + úpravy v „FP pro ostatní.html“ to pokryjí.

---

## 6. Co je už připraveno v tomto projektu

- **Migrace Supabase:** Tabulka `advisors` je vytvořená (sloupce: slug, display_name, logo_url, barvy, kontakty, …). Veřejné čtení podle slug umožňuje zobrazit branding bez přihlášení klienta.
- **FP pro ostatní.html:** Načítá poradce podle parametru `?poradce=slug`, stáhne záznam z Supabase a aplikuje branding (logo, jméno, tagline, barvy, footer). Pokud parametr chybí, zobrazí se výchozí Marek Marek.
- **Test:** V databázi je záznam se slug `test`. Otevři stránku s `?poradce=test` (např. `FP pro ostatní.html?poradce=test`) a měl bys vidět „Test Poradce“, zelený akcent a světle zelené pozadí.

**Další kroky:** Přidat přihlašovací stránku (Supabase Auth), propojit `advisors.user_id` s Auth a po přihlášení zobrazovat wizard už s brandingem daného poradce (bez nutnosti `?poradce=slug`). Pro embed na cizí web stačí odkaz typu `https://fp-poradci.cz/fp-poradce/?poradce=slug&embed=1`. Doporučení: koupit doménu pro produkt (viz **DOMENA-PRODUKTU-FP-PORADCE.md**).

---

## 7. Jak to vyzkoušet na www.marek-marek.cz

Ano – **můžeš ten kód mít na svém webu** a bude to fungovat.

### Varianta A: Soubor přímo na tvé doméně (nejjednodušší na vyzkoušení)

1. **Nahraj na marek-marek.cz soubor** „FP pro ostatní.html“.
2. Dej ho třeba do složky pro finanční plán, např.:
   - `https://www.marek-marek.cz/financni-plan/` → v té složce budeš mít soubor pojmenovaný **index.html** (zkopírovaný obsah z „FP pro ostatní.html“),  
   - nebo nech název souboru: `https://www.marek-marek.cz/financni-plan/FP-pro-ostatni.html`
3. **Důležité:** V souboru jsou cesty k obrázkům typu `images/logo_M_white.png`. Na serveru tedy musí být stejná struktura, např.:
   - `financni-plan/index.html`
   - `financni-plan/images/logo_M_white.png`  
   (nebo podle toho, kde máš obrázky na svém webu – pak v HTML uprav cesty na `../images/` nebo na plnou URL.)
4. **Odkaz s tvým brandingem:**  
   Otevři:  
   **`https://www.marek-marek.cz/financni-plan/?poradce=marek-marek`**  
   (případně `.../FP-pro-ostatni.html?poradce=marek-marek`).  
   Stránka načte z Supabase záznam pro slug `marek-marek` (jméno, barvy, tagline) a zobrazí wizard s tvým brandingem. Supabase se volá z prohlížeče z tvé domény – to je v pořádku, anon klíč to umožňuje.

Takže: **ano, dáš si tam ten kód (index.html / FP pro ostatní.html) na svůj web a s parametrem `?poradce=marek-marek` to u tebe bude fungovat.**

### Varianta B: Jen odkaz nebo iframe na jiný hosting

- Aplikace (FP pro ostatní) běží jinde (Vercel, Netlify, …).
- Na marek-marek.cz pouze dáš **odkaz** na tu adresu s `?poradce=marek-marek`, nebo **iframe** s tímto odkazem. Wizard se pak načítá z té druhé domény, ale vizuálně s tvým brandingem.

Pro rychlý test stačí **Varianta A**: nahrát soubor na svůj web a otevřít ho s `?poradce=marek-marek`.
