-- =====================================================
-- DDL: email_normalized na public.leads (sladěno s Edge Function)
-- Spusť v Supabase SQL Editor (už může být nasazené)
-- =====================================================

-- Sloupec GENERATED – normalizace e-mailu (LOWER + TRIM) pro unikátnost
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email_normalized text
  GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED;

-- UNIQUE index – konflikt při duplicitním e-mailu (různé velikosti/mezery = stejný záznam)
-- CREATE INDEX CONCURRENTLY nelze v transakci; pro živý provoz spusť zvlášť: CREATE UNIQUE INDEX CONCURRENTLY ...
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_normalized_unique
  ON public.leads (email_normalized)
  WHERE email_normalized IS NOT NULL;
