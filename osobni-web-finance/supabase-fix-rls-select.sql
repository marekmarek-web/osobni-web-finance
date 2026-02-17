-- =====================================================
-- Oprava: přidat SELECT policy pro anon, aby po INSERT
-- vrátil Supabase řádek (id) a lead se v tabulce zobrazil.
-- Spusť v Supabase → SQL Editor, pokud už máš tabulky a INSERT policy.
-- =====================================================

-- Leads: anon musí mít SELECT, aby .select('id').single() po insertu vrátil data
DROP POLICY IF EXISTS "leads_anon_select" ON public.leads;
CREATE POLICY "leads_anon_select" ON public.leads
  FOR SELECT TO anon
  USING (true);

-- Assessments: stejně pro vrácení assessment id po insertu
DROP POLICY IF EXISTS "assessments_anon_select" ON public.assessments;
CREATE POLICY "assessments_anon_select" ON public.assessments
  FOR SELECT TO anon
  USING (true);
