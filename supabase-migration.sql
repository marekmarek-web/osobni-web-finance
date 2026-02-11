-- =====================================================
-- Migrace: Diagnostika "Má to smysl?" – leads + assessments
-- Spusť v Supabase SQL Editor
-- =====================================================

-- 1) Tabulka leads
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text,
  email text,
  phone text,
  company_name text,
  employees_count int,
  industry text,
  source text DEFAULT 'link',
  consent_marketing boolean DEFAULT false,
  status text DEFAULT 'draft'
);

-- Sloupce (pokud tabulka už existovala)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS consent_marketing boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text DEFAULT 'link';

-- email_normalized – pro unikátnost dle LOWER(TRIM(email)); Edge Function / frontend používají pro lookup
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email_normalized text
  GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED;
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_normalized_unique
  ON public.leads (email_normalized)
  WHERE email_normalized IS NOT NULL;

-- 2) Tabulka assessments
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  input_json jsonb,
  output_json jsonb,
  score int,
  status text DEFAULT 'done',
  pdf_url text,
  attachments jsonb DEFAULT '[]'::jsonb,
  uploaded_files jsonb DEFAULT '[]'::jsonb
);

-- 3) RLS – zapnout
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 4) RLS leads – INSERT a SELECT pro anon (SELECT potřebný pro vrácení id po insertu)
DROP POLICY IF EXISTS "leads_anon_insert" ON public.leads;
CREATE POLICY "leads_anon_insert" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "leads_anon_select" ON public.leads;
CREATE POLICY "leads_anon_select" ON public.leads
  FOR SELECT TO anon
  USING (true);

-- UPDATE, DELETE pro anon NEPOVOLOVAT

-- 5) RLS assessments – INSERT a SELECT pro anon (SELECT pro vrácení id po insertu)
DROP POLICY IF EXISTS "assessments_anon_insert" ON public.assessments;
CREATE POLICY "assessments_anon_insert" ON public.assessments
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "assessments_anon_select" ON public.assessments;
CREATE POLICY "assessments_anon_select" ON public.assessments
  FOR SELECT TO anon
  USING (true);

-- 6) Storage bucket "attachments" (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 7) Storage RLS – povolit INSERT pro anon do attachments
DROP POLICY IF EXISTS "attachments_anon_insert" ON storage.objects;
CREATE POLICY "attachments_anon_insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'attachments');

-- SELECT pro anon NEPOVOLOVAT (anon nemůže stahovat cizí soubory)
-- Phase 2: stažení přes signed URL ze serveru

-- 8) Storage bucket "reports" (private) – pro vygenerované PDF
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 9) Storage RLS – povolit INSERT pro anon do reports
DROP POLICY IF EXISTS "reports_anon_insert" ON storage.objects;
CREATE POLICY "reports_anon_insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'reports');

-- 10) Sloupec pro nahrané smlouvy/pojistky (cesty v bucketu uploads)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS uploaded_files jsonb DEFAULT '[]'::jsonb;

-- 11) Storage bucket "uploads" (private) – smlouvy, pojistky
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 12) Storage RLS – povolit INSERT pro anon do uploads
DROP POLICY IF EXISTS "uploads_anon_insert" ON storage.objects;
CREATE POLICY "uploads_anon_insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'uploads');

-- Doporučená varianta (bezpečnější): anon INSERT zakázat, upload přes backend + SERVICE_ROLE
