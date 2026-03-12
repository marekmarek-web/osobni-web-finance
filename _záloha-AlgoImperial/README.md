# Záloha AlgoImperial – pro případné použití mimo web

Datum zálohy: 2025-03-11

Z tohoto repozitáře bylo odebráno vše související s **AlgoImperial** (fond, UI karty, data v PDF, odkazy). Záloha slouží k tomu, abyste mohli obsah znovu použít jinde (např. na jiném webu nebo v interním nástroji), ne na obnovu v osobni-web-finance.

## Co bylo odstraněno

- **financni-analyza/index.html** – karta „Jednorázové investice“ (AlgoImperial), `FUND_DETAILS['imperial']`, položka v `funds[]`, výchozí investice s `productKey: 'imperial'`, blok v `renderFundDetails`, mapování v `getProductName`, vazby v `invInputs` a `restoreInv`.
- **fp-poradce/index.html** – stejné úpravy jako u financni-analyza.
- **FP pro ostatní.html** – stejné úpravy jako u financni-analyza.
- **FA - s.r.o/FA s.r.o. hlavní.html** – karta AlgoImperial v investicích, `FUND_LOGOS`, `INV_FUNDS`, výchozí investice, `bindInvestmentInputs` map, `populateFormFromData` set, `ensureInvestmentsAndStrategy` / `migrateImportedData` default, `PDF_FUNDS` záznam pro imperial.
- **images/README.md** – zmínka o AlgoImperial.png a algoimperial.png.

Obrázek `algoimperial.png` v kořeni repozitáře byl v gitu již smazaný (D); pokud ho máte lokálně, zálohujte si ho sami.

## Snippety pro opětovné použití

V souboru `algoimperial-snippety.md` jsou uloženy vyjmuté HTML/JS úryvky (karta, FUND_DETAILS, popis fondu, mapování), aby šly v případě potřeby zkopírovat do jiného projektu.
