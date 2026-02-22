# Checklist – Branding kalkulaček na Marek Příbramský (Premium Brokers)

Tento seznam pokrývá všechny změny potřebné k tomu, aby hypoteční, životní, penzijní a investiční kalkulačky byly 100 % v brandu **Marek Příbramský / Premium Brokers** a připravené ke spuštění.

---

## 1. Obrázky a assety

- [ ] **Loga PB** – V kalkulačkách používat pouze PB loga z `assets/img/logos/`:
  - `pb-logo-no-bg.png` (header – světlý kontext)
  - `pb-logo-no-bg-grey.png` (footer)
- [ ] **Bankovní loga** (hypoteční kalkulačka) – Zkopírovat z `Novy web/images/` do `premium-brokers/assets/img/` (nebo `assets/img/banks/`):
  - `kb-logo.png`, `csob-logo.png`, `raiffeisenbank-logo.png`, `unicredit-logo.png`, `ceskasporitelna-logo.png`, `mbank-logo.png`
- [ ] **Loga partnerů** (investiční kalkulačka) – Zkopírovat z `Novy web/images/` do `premium-brokers/assets/img/`:
  - `creif-logo.png`, `amundi-logo.png`, `edward-logo.png`, `investika-logo.png`, `avant-logo.png`, `conseq-logo.png`, `cyrrus-logo.png`
- [ ] **Favicon** – Nastavit na PB logo (např. `../assets/img/logos/pb-logo-no-bg.png` nebo vygenerovaný favicon.ico).
- [ ] **Hero/pozadí** (penzijní kalkulačka) – Použít např. `../assets/img/hero/sitting2.png` nebo jinou PB fotku; odstranit odkaz na `DSC07165.jpg` / Marek Marek.

---

## 2. Header (všechny 4 kalkulačky)

- [ ] Nahradit celý blok navigace headerem z `premium-brokers/index.html` (řádky cca 72–119).
- [ ] Upravit cesty pro substránky: `href="/"` → `href="../"`, `href="/#sluzby"` → `href="../#sluzby"`, `href="/kontakt/"` → `href="../kontakt/"`, atd.
- [ ] Odkazy na kalkulačky: `href="/hypotecnikalkulacka/"` → `href="../hypotecnikalkulacka/"` (obdoba pro investiční, životní, penzijní).
- [ ] Logo: `src="assets/img/logos/pb-logo-no-bg.png"` → `src="../assets/img/logos/pb-logo-no-bg.png"`.
- [ ] Připojit `../assets/css/styles.css` tam, kde se používá hlavní PB styl (pokud má být vzhled 1:1 s úvodní stránkou).
- [ ] Mobilní menu – stejná struktura odkazů jako na indexu (O mně, Služby, Spolupráce, Nástroje dropdown, Blog, Kontaktujte mě).
- [ ] CTA tlačítko: text „Kontaktujte mě“, odkaz `../kontakt/`.

---

## 3. Footer (všechny 4 kalkulačky)

- [ ] Nahradit celý footer footerem z `premium-brokers/index.html` (řádky cca 815–848).
- [ ] Cesty: `href="/"` → `href="../"`, `href="/#sluzby"` → `href="../#sluzby"`, `href="/blog/"` → `href="../blog/"`, `href="/kontakt/"` → `href="../kontakt/"`, `href="/gdpr/"` → `href="../gdpr/"`, `href="/cookies/"` → `href="../cookies/"`.
- [ ] Logo v patičce: `assets/img/logos/pb-logo-no-bg-grey.png` → `../assets/img/logos/pb-logo-no-bg-grey.png`.
- [ ] Text „Marek Příbramský“, popis „Privátní finanční plánování…“, sekce Rychlé odkazy, Nástroje, Pobočky, Kontakt beze změny obsahu.
- [ ] Právní disclaimer (BEplan, IČO, zákony) a odkaz na M2DigitalAgency ponechat.

---

## 4. Texty a identity (Marek Příbramský)

- [ ] Všechny výskyty **„Marek Marek“** → **„Marek Příbramský“**.
- [ ] **„Finanční partner“** v headeru → např. odstranit nebo nahradit **„Privátní finanční plánování“** / **„Premium Brokers“**.
- [ ] Titulky stránek (`<title>`) – u všech kalkulaček doplnit „| Marek Příbramský“ nebo „| Premium Brokers“.

---

## 5. Kontaktní údaje

- [ ] **E-mail:** všude `kontakt@marek-marek.cz` → `pribramsky@premiumbrokers.cz`.
- [ ] **Telefon:** `+420 778 511 166` → `+420 728 480 423`.
- [ ] **Adresa:** „Jana z Dražic 99“ → „Nám. Jana z Dražic 99, 413 01 Roudnice nad Labem“ (nebo dle PB úvodní stránky).
- [ ] **Sociální sítě** – nahradit odkazy PB:
  - Facebook: `https://www.facebook.com/PremiumBrokersRCE`
  - Instagram: `https://www.instagram.com/premiumbrokers.cz/`
  - LinkedIn: `https://www.linkedin.com/in/marek-pribramsky/`
  - WhatsApp – odstranit nebo nahradit dle rozhodnutí (PB může mít jiný kontakt).

---

## 6. Formuláře a FormSubmit

- [ ] **FormSubmit endpoint:** všude `kontakt@marek-marek.cz` → `pribramsky@premiumbrokers.cz`.
- [ ] Kontrola všech `action="https://formsubmit.co/...` a `fetch("https://formsubmit.co/ajax/...` v:
  - hypotecnikalkulacka/index.html
  - zivotnikalkulacka/index.html
  - penzijnikalkulacka/index.html
  - investicnikalkulacka/index.html
- [ ] Předmět e-mailu / hidden pole – případně upravit na „Poptávka – Marek Příbramský / Hypoteční kalkulačka“ atd.

---

## 7. Barvy, Tailwind, CSS (PB brand)

- [ ] **Tailwind config** v každé kalkulačce – sjednotit s `premium-brokers/index.html`:
  - `brand.navy: '#1D2354'`, `navyLight: '#2a3366'`, `cyan: '#4FC6F2'`, `text: '#0F172A'`, `muted: '#475569'`, `border: '#E2E8F0'`, `background: '#F8FAFC'`.
  - Odstranit nebo přejmenovat barvy „Marek Marek“ (např. `brand.main`, `brand.dark` s jinými hodnotami) tak, aby převládaly PB barvy.
- [ ] **CSS** – odkazy na `../assets/css/styles.css` v kalkulačkách; v inline stylech nahradit `#0a0f29`, `#0B3A7A`, zlatou atd. za PB barvy (např. `#1D2354`, `#4FC6F2`).
- [ ] Tlačítka a CTA – gradienty a hover podle PB (např. `from-brand-navy to-brand-navyLight`, `focus:ring-[#4FC6F2]/40`).
- [ ] Slider thumb, aktivní stavy – barva např. `#4FC6F2` nebo `brand-cyan` místo zlaté, pokud má být plně PB vzhled.

---

## 8. Recenze a trust prvky

- [ ] **Google recenze** – odkaz změnit na vyhledávání „Marek Příbramský“ / „Premium Brokers“ (ne „marek marek recenze“).
- [ ] **Firmy.cz** – odkaz a text nahradit za profil Marek Příbramský / Premium Brokers, nebo sekci odstranit / zobecnit.
- [ ] Hodnocení „4.8“ a texty recenzí – případně upravit na PB (nebo ponechat obecný formulář).

---

## 9. Odkazy a navigace

- [ ] Žádné odkazy na `marek-marek.cz`, `financni-plan`, `podnikatele` v menu – pouze PB struktura (O mně, Služby, Spolupráce, Nástroje, Blog, Kontakt).
- [ ] Rozcestníky „Spočítejte si sami“ – odkazy na `../hypotecnikalkulacka/`, `../investicnikalkulacka/`, `../zivotnikalkulacka/`, `../penzijnikalkulacka/`, `../kalkulacky/`.
- [ ] Odkaz na finanční analýzu: `../financni-analyza/` pouze pokud tato stránka v PB existuje, jinak např. `../#sluzby` nebo `../kalkulacky/`.

---

## 10. Právní a GDPR

- [ ] Odkaz na ochranu osobních údajů: `https://www.beplan.cz/ochrana-osobnich-udaju/` (již na indexu).
- [ ] Cookies: `../cookies/`, GDPR: `../gdpr/`.
- [ ] Disclaimer v patičce (BEplan, IČO, zákony) – stejný text jako na `premium-brokers/index.html`.

---

## 11. Skripty a chování

- [ ] Připojit `../assets/js/main.js` tam, kde je potřeba (např. mobilní menu, dropdown Nástroje) – a zkontrolovat, že cesty v main.js fungují z podadresáře.
- [ ] Odstranit nebo upravit JS, který mění header podle scrollu („Marek Marek“ logo swap) – nahradit za PB logiku nebo jednoduchý PB header bez swapu.

---

## 12. Finální kontrola

- [ ] Projít všechny 4 kalkulačky v prohlížeči (hlavní stránka + hypotéka, životní, penze, investice).
- [ ] Otestovat formuláře – odeslání na `pribramsky@premiumbrokers.cz`.
- [ ] Zkontrolovat mobilní zobrazení a menu.
- [ ] Zkontrolovat, že žádná zmínka „Marek Marek“, „kontakt@marek-marek.cz“, „+420 778 511 166“ ani staré sociální sítě nezbývají.

---

Po odškrtnutí všech bodů budou kalkulačky plně v brandu **Marek Příbramský (Premium Brokers)** a připravené ke spuštění.
