# Oprava „Cannot find module @supabase/supabase-js“ na Vercelu

Vercel bere závislosti jen tehdy, když v **správném místě** má **package.json** a při buildu se spustí `npm install`. Když je `package.json` jinde než složka `api/`, nebo chybí, moduly se nainstalují špatně a funkce padá.

---

## Důležité: kde má být package.json

- **package.json** musí být ve **stejném levelu** jako složka **api/** (ne uvnitř api/, ne v jiné podsložce).
- To samé místo musí být to, z čeho Vercel builduje (repo root, nebo „Root Directory“ v nastavení).

Příklad správné struktury v repu:

```
osobni-web-finance (repo root)
├── package.json          ← TADY (kořen repa)
├── api/
│   └── send-report.js
├── index.html
└── ... další soubory
```

---

## Krok 1: package.json v kořeni repa na GitHubu

1. Otevři **github.com** → repozitář **osobni-web-finance**.
2. Jsi v **kořeni** repa (ne uvnitř složky typu `api`, `docs`, `web`).
3. Zkontroluj, jestli tam už je soubor **package.json**:
   - **Pokud ANO** – klikni na něj → **Edit (tužka)** a uprav tak, aby uvnitř byl přesně níže uvedený obsah (hlavně `dependencies` s `@supabase/supabase-js` a `resend`).
   - **Pokud NE** – v kořeni repa klikni **Add file** → **Create new file**, název souboru napiš: **package.json**, do obsahu vlož:

```json
{
  "name": "osobni-web-finance",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "resend": "^3.2.0"
  }
}
```

4. **Commit** (Commit new file / Commit changes).

---

## Krok 2: Root Directory na Vercelu

1. **Vercel** → projekt **osobni-web-finance** → **Settings** → **General**.
2. Sekce **Root Directory**:
   - Pokud je tam vyplněná nějaká složka (např. `web`, `docs`, `app`), pak **package.json** i složka **api/** musí být **uvnitř té složky**. Tj. v repu musíš mít např. `web/package.json` a `web/api/send-report.js`, a Root Directory = `web`.
   - Pokud chceš budovat z **kořene repa**, nech **Root Directory prázdné** (nevyplňuj nic) a ujisti se, že **package.json** i **api/** jsou v kořeni repa (jako v obrázku výše).
3. Ulož.

---

## Krok 3: Vyčistit cache a znovu nasadit

1. Vercel → **Deployments**.
2. U **posledního** deploye klikni na **⋯** (tři tečky).
3. Zvol **Redeploy**.
4. Pokud u toho uvidíš volbu **Clear build cache** (nebo podobně), **zaškrtni ji** a potvrď Redeploy.

Po novém buildu by měl Vercel v kořeni (nebo v Root Directory) najít **package.json**, spustit `npm install` a funkce v **api/send-report.js** by měla najít `@supabase/supabase-js` i `resend`.

---

## Shrnutí

| Co | Kde |
|----|-----|
| **package.json** (s `@supabase/supabase-js` a `resend`) | Ve **stejném** adresáři jako složka **api/** (kořen repa, nebo složka z Root Directory). |
| **api/send-report.js** | Složka **api** vedle tohoto **package.json**. |
| **Redeploy** | Po změně s **Clear build cache**. |

Když to pořád píše „Cannot find module '@supabase/supabase-js'“, pošli prosím:  
- screenshot **kořene** repa na GitHubu (všechny soubory a složky v první úrovni),  
- a z Vercelu hodnotu **Root Directory** (Settings → General).  
Podle toho se dá přesně říct, co je špatně.
