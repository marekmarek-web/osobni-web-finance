-- =====================================================
-- Oprava: přidat chybějící sloupec consent_marketing do leads
-- Spusť v Supabase → SQL Editor → Run
-- =====================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS consent_marketing boolean DEFAULT false;
