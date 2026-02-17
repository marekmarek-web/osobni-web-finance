# Vlastní doména pro FP pro poradce

Pro produkt „FP pro poradce“ dává smysl **vlastní doména** – působí to profesionálněji a produkt není vázaný na tvoje jméno (marek-marek.cz). Poradci i klienti pak vidí neutrální značku nástroje.

---

## Proč vlastní doména

- **Ne pod tvým jménem** – produkt vystupuje jako samostatná služba, ne jako „něco od Marek Marek“.
- **Důvěra poradců** – přihlášení a předplatné na adrese typu `fp-poradci.cz` působí jako B2B produkt, ne osobní web.
- **Marketing** – můžeš produkt nabízet pod vlastní značkou (slogan, logo, landing page).
- **Škálovatelnost** – kdybys produkt jednou prodal nebo předal, doména jde přenést bez zásahu do marek-marek.cz.

Technicky se nic nemění: stejná aplikace (Vercel + složka fp-poradce), jen na doménu **namíříš** buď celý Vercel projekt, nebo přesměrování z nové domény na Vercel.

---

## Návrhy názvů domény

| Doména | Poznámka |
|--------|----------|
| **fp-poradci.cz** | Krátké, přímo „FP pro poradce“. |
| **financniplan-poradci.cz** | Více popisné. |
| **fp-nastroj.cz** | Zdůrazňuje „nástroj“. |
| **planproporadce.cz** | „Plán pro poradce“. |
| **fp-pro-poradce.cz** | Celý název produktu. |

Nejprve zkontroluj **dostupnost** (např. reg.cz, active24.cz, Forpsi) – zda je doména volná a za rozumnou cenu.

---

## Jak doménu zapojit

1. **Zakoupit doménu** u libovolného registrátora (.cz bývá cca 200–400 Kč/rok).
2. **Kde bude běžet aplikace:**
   - **Vercel:** V projektu **osobni-web-finance** v **Settings → Domains** přidáš např. `fp-poradci.cz` a `www.fp-poradci.cz`. Vercel ti ukáže, jaké DNS záznamy nastavit u domény (CNAME nebo A). Po propagaci DNS bude celá aplikace dostupná na fp-poradci.cz – včetně `/fp-poradce/` (složka z repa).
   - **Jiný hosting:** Pokud budeš hostovat jinde, nahraješ tam složku `fp-poradce` (a případně API přes reverse proxy na Vercel) a na tu adresu namíříš novou doménu.
3. **V kódu** pak všude používej novou doménu – odkazy, e-maily, Stripe success/cancel URL, webhook není potřeba měnit (zůstává Vercel URL), ale **success_url** po platbě může být `https://fp-poradci.cz/fp-poradce/prihlaseni.html?success=1` – to se nastavuje v frontendu (prihlaseni.html posílá success_url v těle requestu na create-checkout), takže jakmile bude stránka běžet na fp-poradci.cz, bude to automaticky správně.

---

## Shrnutí

- Koupit **vlastní doménu** (např. fp-poradci.cz).
- V **Vercel → Domains** ji přidat k projektu a nastavit DNS u registrátora.
- Aplikace (včetně `/fp-poradce/`) pak běží na **https://fp-poradci.cz** – sofistikovaně a bez vazby na tvoje jméno.

V dokumentaci (PLAN, CO-SE-DEJE, návody) pak můžeš všude používat **fp-poradci.cz** jako hlavní URL produktu; www.marek-marek.cz může zůstat jako tvá osobní/firemní stránka s odkazem na tento nástroj.
