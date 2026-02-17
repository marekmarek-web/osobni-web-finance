# Napojení projektu na GitHub a www.marek-marek.cz/api

Cíl: mít kód v GitHubu a aby se změny (po tvém pushi) projevily na www.marek-marek.cz/api – bez ručního kopírování.

---

## Co potřebuješ mít

1. **Účet na GitHubu** (github.com) – pokud ho nemáš, založ si ho.
2. **Repozitář na GitHubu** pro tento projekt. Buď už existuje (např. něco jako `marek-marek-api` nebo `www-marek-marek`), nebo ho vytvoříš.

---

## Varianta A: Repozitář už máš (např. pod www.marek-marek.cz/api)

Pak jen chceš, aby **tato složka FA** (nebo celý „Nový web“) byl klonem toho repa a ty v ní edituješ a pushuješ.

### 1. Zjisti adresu repozitáře

- Jdi na **github.com** → přihlas se → najdi repozitář, který je napojený na www.marek-marek.cz/api.
- Klikni na zelené **Code** → zkopíruj adresu (HTTPS, např. `https://github.com/TVOJE-uzivatelske-jmeno/nazev-repa.git`).

### 2. Otevři složku v Cursoru jako „projekt“

- V Cursoru: **File → Open Folder** a vyber složku, která **bude** odpovídat obsahu toho GitHub repa.
  - Buď složku **FA** (pokud má celý repa obsahovat jen diagnostiku),
  - nebo složku **Nový web** (pokud má repa obsahovat celý web včetně FA).

### 3. Napojení na GitHub (pokud tu složku ještě nemáš jako klon)

**Možnost 3a – složka je prázdná / zatím bez gitu**

V terminálu (Cursor: View → Terminal) v té složce:

```bash
git init
git remote add origin https://github.com/TVOJE-uzivatelske-jmeno/NAZEV-REPA.git
git pull origin main
```

(Pokud tvoje výchozí větev není `main` ale `master`, napiš `git pull origin master`.)

**Možnost 3b – složku už máš s kódem a chceš ji „nahrát“ do existujícího repa**

V terminálu ve složce FA (nebo Nový web):

```bash
git init
git add .
git commit -m "První commit - diagnostika FA"
git branch -M main
git remote add origin https://github.com/TVOJE-uzivatelske-jmeno/NAZEV-REPA.git
git push -u origin main
```

(Adresu `origin` nahraď svou reálnou adresou repa z kroku 1.)

Od teď: **edituješ tady v Cursoru → commit → push** a kód je v GitHubu. Deploy na www.marek-marek.cz/api pak závisí na tom, jak máš hosting nastavený (viz níže).

---

## Varianta B: Repozitář ještě nemáš

1. Na **github.com** → **New repository**.
2. Název např. `marek-marek-api` nebo `diagnostika-fa`.
3. Nezaškrtávej „Add a README“ (pokud do repa nahraješ celou složku FA).
4. Vytvoř repozitář a zkopíruj jeho HTTPS adresu (např. `https://github.com/TVOJE-jmeno/marek-marek-api.git`).
5. V Cursoru otevři složku **FA** (File → Open Folder → vyber `FA`).
6. V terminálu (View → Terminal), ujisti se, že jsi ve složce FA, pak:

```bash
git init
git add .
git commit -m "První commit - diagnostika a API"
git branch -M main
git remote add origin https://github.com/TVOJE-jmeno/NAZEV-REPA.git
git push -u origin main
```

Tím bude celá složka FA v GitHubu jako „root“ repa. Pokud chceš, aby na webu byl kód dostupný pod cestou `/api`, záleží to na hostingu (Vercel/Netlify složka = root projektu, nebo server má v `/api` naklonovanou tuto složku).

---

## Jak to mít „napojené rovnou na root v GitHubu“

- **„Root“ repa** = to, co je v kořenu repozitáře (po `git clone` nebo po otevření na GitHubu).
- Aby sis nemusel nic ručně kopírovat:
  1. **V Cursoru máš otevřenou jednu složku** – tu, která odpovídá obsahu toho repa (buď jen **FA**, nebo **Nový web** včetně FA).
  2. **Všechny úpravy děláš jen tam** a pak:
     - `git add .`
     - `git commit -m "popis změny"`
     - `git push`
  3. Hosting (Vercel, Netlify nebo server) má repozitář napojený na www.marek-marek.cz/api a bere kód z toho repa – takže po pushi se nasadí nová verze.

Stručně: **editace jen v Cursoru v té napojené složce → push do GitHubu → deploy z GitHubu na www.marek-marek.cz/api.**

---

## Nastavení deploye na www.marek-marek.cz/api

Způsob závisí na tom, kde běží www.marek-marek.cz:

- **Vercel / Netlify**  
  V projektu připojíš GitHub repozitář. Při každém pushi do `main` (nebo zvolené větve) se spustí nový deploy. Root repa (nebo zvolená složka v nastavení projektu) = to, co se nasadí. Cestu `/api` můžeš mít jako root projektu, nebo máš v repu složku `api` a v build settings nastavíš root na ni.

- **Vlastní server (VPS, shared hosting)**  
  Na serveru v adresáři pro www.marek-marek.cz/api máš klon repa (`git clone ...`) a po tvém pushi na serveru v tom adresáři spustíš `git pull` (ručně, nebo přes cron/skript). Tím se „root“ repa na serveru aktualizuje a odpovídá GitHubu.

Pokud napíšeš, jestli používáš Vercel, Netlify, nebo vlastní server, můžu ti popsat přesně: která složka v repu = root a jak nastavit cestu /api.

---

## Shrnutí

| Krok | Co udělat |
|------|------------|
| 1 | Mít repozitář na GitHubu (existující nebo nový). |
| 2 | V Cursoru otevřít složku, která má = obsah toho repa (FA nebo Nový web). |
| 3 | V té složce `git init` (pokud ještě není git), `git remote add origin URL-REPA`, pak `git add .` → `commit` → `push`. |
| 4 | Na hostingu (Vercel/Netlify/server) mít napojený tento repozitář na www.marek-marek.cz/api. |

Tím budeš mít kód napojený rovnou na root (nebo zvolenou složku) v GitHubu a nebudeš muset nic ručně editovat na serveru – stačí editovat v Cursoru a pushovat.
