-- =====================================================
-- Oprava RLS pro INSERT do tabulky leads
-- Spusť v Supabase → SQL Editor
-- =====================================================

-- 1. Zkontroluj, že RLS je zapnuté
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 2. Smaž všechny existující policies pro leads (aby nedošlo ke konfliktům)
DROP POLICY IF EXISTS "leads_anon_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_anon_select" ON public.leads;
DROP POLICY IF EXISTS "Allow anon insert" ON public.leads;
DROP POLICY IF EXISTS "Allow anon select" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.leads;
DROP POLICY IF EXISTS "Enable select for anon" ON public.leads;

-- 3. Vytvoř nové policies pro leads
CREATE POLICY "leads_anon_insert" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "leads_anon_select" ON public.leads
  FOR SELECT TO anon
  USING (true);

-- 4. Stejně pro assessments
DROP POLICY IF EXISTS "assessments_anon_insert" ON public.assessments;
DROP POLICY IF EXISTS "assessments_anon_select" ON public.assessments;
DROP POLICY IF EXISTS "Allow anon insert" ON public.assessments;
DROP POLICY IF EXISTS "Allow anon select" ON public.assessments;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.assessments;
DROP POLICY IF EXISTS "Enable select for anon" ON public.assessments;

CREATE POLICY "assessments_anon_insert" ON public.assessments
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "assessments_anon_select" ON public.assessments
  FOR SELECT TO anon
  USING (true);

-- 5. Zkontroluj oprávnění (GRANT)
GRANT INSERT ON public.leads TO anon;
GRANT SELECT ON public.leads TO anon;
GRANT INSERT ON public.assessments TO anon;
GRANT SELECT ON public.assessments TO anon;

-- 6. Zkontroluj, že policies existují
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('leads', 'assessments')
ORDER BY tablename, policyname;
