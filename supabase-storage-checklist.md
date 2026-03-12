# Storage – checklist pro Supabase

Proveď v Supabase Dashboard. Můžeš buď proklikat ručně (A+B), nebo spustit migraci (C).

---

## A) Buckets (ruční proklikání)

1. **Supabase Dashboard** → **Storage** (levý panel).
2. **New bucket**:
   - **attachments** – Name: `attachments`, **Private**, File size limit např. 10 MB, Allowed MIME: `application/pdf`, `image/jpeg`, `image/png`, `image/webp` → Create.
   - (Pokud už existuje, nic nedělej.)
3. **New bucket** znovu:
   - **reports** – Name: `reports`, **Private**, File size limit 10 MB, Allowed MIME: `application/pdf` → Create.
4. **New bucket** znovu:
   - **uploads** – Name: `uploads`, **Private**, File size limit 10 MB, Allowed MIME: `application/pdf`, `image/jpeg`, `image/png`, `image/jpg` → Create.

- [ ] **attachments** – existuje (private), pro nahrané smlouvy/pojistky
- [ ] **reports** – vytvořen (private), pro vygenerované PDF
- [ ] **uploads** – vytvořen (private), pro smlouvy/pojistky z kroku 6

---

## B) Policies (rychlá varianta – anon upload)

⚠️ Riziko spamu. Lepší varianta: upload přes backend (Úkol 4 v docs).

1. **Storage** → vyber bucket **attachments** → **Policies**.
2. **New policy** → „For full customization“:
   - Policy name: `attachments_anon_insert`
   - Allowed operation: **INSERT**
   - Target roles: **anon**
   - WITH CHECK expression: `bucket_id = 'attachments'`
   - Save.
3. To samé pro bucket **reports**:
   - Policy name: `reports_anon_insert`
   - Operation: **INSERT**, Role: **anon**
   - WITH CHECK: `bucket_id = 'reports'`
   - Save.
4. To samé pro bucket **uploads**:
   - Policy name: `uploads_anon_insert`
   - Operation: **INSERT**, Role: **anon**
   - WITH CHECK: `bucket_id = 'uploads'`
   - Save.

- [ ] **attachments** – anon INSERT povolen
- [ ] **reports** – anon INSERT povolen
- [ ] **uploads** – anon INSERT povolen

---

## C) Rychlá varianta – jedna migrace

1. **Supabase** → **SQL Editor** → **New query**.
2. Zkopíruj celý obsah souboru **supabase-migration.sql** (včetně bucketů `attachments`, `reports`, `uploads` a jejich RLS policies).
3. **Run**.
4. V **Storage** zkontroluj, že se objevily buckety **attachments**, **reports** a **uploads**.

- [ ] Migrace `supabase-migration.sql` proběhla bez chyby
- [ ] V Storage jsou buckety **attachments**, **reports** a **uploads**
