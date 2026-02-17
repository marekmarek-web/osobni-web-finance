# FP pro poradce – složka pro GitHub / web

Tato složka je určená pro cestu **/fp-poradce/** na webu. Doporučené je nasadit ji pod **vlastní doménou produktu** (např. `https://fp-poradci.cz/fp-poradce/`), aby produkt nebyl pod osobní značkou – viz **DOMENA-PRODUKTU-FP-PORADCE.md** v kořeni projektu. Alternativa: `https://www.marek-marek.cz/fp-poradce/`.

## Soubory

| Soubor | Popis |
|--------|------|
| **index.html** | Wizard finanční analýzy (nástroj). Otevře se na `/fp-poradce/` nebo `/fp-poradce/index.html`. S parametrem `?poradce=slug` se zobrazí branding daného poradce. |
| **prihlaseni.html** | Přihlášení, registrace a předplatné (299 Kč/měsíc). Odkaz „Pro poradce: Přihlásit“ v wizardu vede sem. |
| **images/** | Sem vlož logo (např. `logo_M_white.png`), které wizard používá v hlavičce. Pokud ho nepřidáš, zobrazí se záložní písmeno. |

## Odkazy

- Z kořene webu: odkaz na přihlášení je `fp-poradce/prihlaseni.html`.
- Uvnitř této složky: wizard odkazuje na `prihlaseni.html`, přihlášení odkazuje na `index.html?poradce=slug`.

## API

Předplatné volá API na **https://osobni-web-finance.vercel.app** (nastaveno v `prihlaseni.html`). Na Vercelu musí být vyplněné env: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_ANON_KEY`.
