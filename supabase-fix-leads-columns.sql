-- =====================================================
-- Oprava: doplnit všechny chybějící sloupce v tabulce leads
-- Spusť v Supabase → SQL Editor → Run (jednou stačí)
-- =====================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS employees_count int;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text DEFAULT 'link';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS consent_marketing boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
