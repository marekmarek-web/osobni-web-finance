# Návod: Jak spustit SQL v Supabase (krok za krokem)

Tohle je návod pro úplný začátečník – kde kliknout a co vložit, aby se ti v diagnostice ukládaly leady.

---

## Kde to celé je

Supabase = služba na internetu, kde máš databázi.  
Adresa: **https://supabase.com**

---

## Krok 1: Otevři svůj projekt v Supabase

1. Jdi na **https://supabase.com** a přihlas se (pokud máš účet).
2. Uvidíš seznam **projektů**. Klikni na ten svůj (např. ten, který má v názvu nebo URL něco jako `bqevrmtonpbmbyvvynev` – to je tvůj projekt z diagnostiky).
3. Otevře se **Dashboard** projektu – uprostřed je přehled, v **levém sloupci** je menu.

---

## Krok 2: Otevři SQL Editor

1. V **levém sloupci** (sidebar) najdi položku **„SQL Editor“** (ikona tužky / zápisníku).
2. Klikni na **„SQL Editor“**.
3. Nahoře může být tlačítko **„New query“** nebo **„Nová dotaz“** – klikni na něj (vytvoříš prázdný editor pro SQL).

---

## Krok 3: Zkopíruj SQL do editoru

Máš dvě možnosti:

### Možnost A: Už máš tabulky `leads` a `assessments` (doplnění pravidel)

1. Otevři v počítači soubor **`supabase-fix-rls-select.sql`** (je ve složce FA).
2. Zkopíruj **celý obsah** souboru (Ctrl+A, Ctrl+C).
3. V Supabase v okně SQL Editoru **všechno smaž** (pokud tam něco je) a vlož zkopírovaný text (Ctrl+V).

### Možnost B: Tabulky ještě nemáš, chceš nastavit vše od začátku

1. Otevři soubor **`supabase-migration.sql`** (ve složce FA).
2. Zkopíruj **celý obsah** souboru.
3. V Supabase v SQL Editoru vlož tento text (Ctrl+V).

---

## Krok 4: Spusť SQL

1. Dole pod editorem (nebo vpravo) je tlačítko **„Run“** nebo **„Spustit“** (často zelené).
2. Klikni na **„Run“**.
3. Po chvíli se dole objeví výsledek:
   - **Success** / **Success. No rows returned** = je to v pořádku, nic dalšího nedělej.
   - **Error** = přečti si červený text (popis chyby). Může to znamenat, že tabulky ještě neexistují – v tom případě spusť celou **supabase-migration.sql** (Možnost B výše).

---

## Krok 5: Ověření, že to funguje

1. V levém menu Supabase klikni na **„Table Editor“** (nebo **„Tables“**).
2. V seznamu tabulek by měla být **`leads`** a **`assessments`**.
3. Otevři diagnostiku v prohlížeči, vyplň krok 1 a klikni **„Pokračovat na diagnostiku“**.
4. Zpět v Supabase v **Table Editor** otevři tabulku **`leads`** a obnov stránku (F5) – měl by se objevit nový řádek (lead).

---

## Shrnutí – co vlastně děláš

- **SQL Editor** = místo, kde Supabase spouští příkazy pro databázi.
- **„Run“** = odeslání těchto příkazů do databáze.
- Tím, že spustíš náš soubor, přidáš do databáze tabulky a pravidla (policy), aby aplikace mohla ukládat leady a aby se ti po uložení vrátilo ID.

Pokud něco nejde, napiš mi přesně:
- co vidíš na obrazovce po kliknutí na Run (Success nebo celý text chyby),
- a jestli v menu vidíš tabulky `leads` a `assessments`.
