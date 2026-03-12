# Oprava 404 u /api/send-report na Vercelu

Vercel vrací **404: NOT_FOUND**, protože v deployovaném projektu **není složka `api`** v kořeni buildu.  
Commit „Update index.html“ znamená, že se deployuje hlavní web, ale **složka `api` tam nejspíš není** (nebyla do repa pushnutá, nebo je v jiné složce).

---

## Co musí být v repozitáři, který Vercel deployuje

V **kořeni** toho, co Vercel bere jako „root“ projektu, musí být:

- složka **`api`**
- v ní soubor **`send-report.js`**
- v kořeni soubor **`package.json`** (s závislostmi `resend` a `@supabase/supabase-js`)

Tj. struktura:

```
api/
  send-report.js
package.json
index.html
... (zbytek webu)
```

---

## Krok 1: Zkontroluj GitHub

1. Otevři repozitář **github.com/marekmarek-web/osobni-web-finance**.
2. Podívej se do **kořene** repa (hlavní stránka repa).
3. Zkontroluj:
   - Je tam složka **`api`**?
   - Je v ní soubor **`send-report.js`**?
   - Je v kořeni **`package.json`**?

- **Pokud ANO** → přejdi na krok 3 (Vercel Root Directory).  
- **Pokud NE** → pokračuj krokem 2.

---

## Krok 2: Přidej `api` a `package.json` do kořene repa

Vercel deployuje z **kořene** repa (nebo z „Root Directory“, viz krok 3). Proto musíš mít `api/` a `package.json` přímo tam.

### Možnost A: Repo root = složka FA (celý projekt je FA)

Pokud v Cursoru pracuješ se složkou **FA** a ta je celý obsah repa (git je inicializovaný ve FA), pak by už měla být struktura správně. Zkontroluj, že jsi vše pushnul:

```bash
cd "C:\Users\PC1\Desktop\Nový web\FA"
git status
git add api/
git add package.json
git status
git commit -m "Přidání API send-report pro Vercel"
git push
```

Po pushi nech Vercel znovu nasadit (automaticky, nebo Redeploy).

### Možnost B: Repo root = jiná složka (např. celý „Nový web“)

Pokud je root repa např. **„Nový web“** a uvnitř máš složku **FA** (s `api/` a `package.json`), pak Vercel bere jako root celou tu složku a v ní **není** `api/` v kořeni – je až v `FA/api/`. Vercel pak route `/api/send-report` nevidí.

**Řešení:** V nastavení Vercelu nastav **Root Directory** na složku, která obsahuje `api/` a `package.json`:

1. Vercel → projekt **osobni-web-finance** → **Settings** → **General**.
2. Sekce **Root Directory** → **Edit**.
3. Zadej cestu ke složce, která má v sobě `api` a `package.json`.  
   - Pokud je v repu struktura `FA/api/` a `FA/package.json`, zadej: **`FA`**.
4. **Save** a udělej **Redeploy** (Deployments → ⋯ → Redeploy).

### Možnost C: Repo root = jen hlavní web (bez FA)

Pokud je v kořeni repa jen hlavní web (např. jen `index.html` a další soubory) a složku **FA** do repa neposíláš, musíš do **kořene** repa přidat:

1. Složku **`api`** a do ní soubor **`send-report.js`** (zkopíruj z `FA/api/send-report.js`).
2. Soubor **`package.json`** (zkopíruj z `FA/package.json`).

Tj. v repozitáři musí být:

- `api/send-report.js`
- `package.json`

Pak commit + push a na Vercelu Redeploy.

---

## Krok 3: Root Directory na Vercelu (když je FA v podsložce)

1. **Vercel** → **osobni-web-finance** → **Settings** → **General**.
2. **Root Directory**: pokud je v repu složka **FA** a v ní je `api/` + `package.json`, nastav na **`FA`**.
3. Ulož a v **Deployments** udělej **Redeploy**.

---

## Krok 4: Ověření

1. Po redeployi otevři: **https://osobni-web-finance.vercel.app/api/send-report**  
   - Očekávaná odpověď: **405 Method Not Allowed** (GET není povolený, API čeká POST). To znamená, že route existuje a 404 je vyřešená.
2. Pokud stále 404: zkontroluj znovu, že v **Build Logs** (Vercel → poslední deployment → Logs) není chyba a že se buildu účastní složka s `api/`.

---

## Shrnutí

| Problém | Řešení |
|--------|--------|
| V repu není `api/` | Přidej složku `api` a soubor `api/send-report.js` do kořene repa (nebo do složky, která je Root Directory). |
| V repu není `package.json` v rootu | Přidej `package.json` (s `resend` a `@supabase/supabase-js`) do stejného rootu. |
| `api/` je až v podsložce (např. FA) | Vercel → Settings → General → Root Directory = **FA** (nebo ta složka, kde je `api/`). |
| Změny v repu už jsou | Vercel → Deployments → Redeploy. |

Po těchto úpravách by měl endpoint **/api/send-report** přestat vracet 404.
