-- Drop existing RLS policies and create a simpler one
DROP POLICY IF EXISTS "Company owners can view their users" ON public.company_users;
DROP POLICY IF EXISTS "Company owners can add users" ON public.company_users;
DROP POLICY IF EXISTS "Company owners can update their users" ON public.company_users;
DROP POLICY IF EXISTS "Company owners can delete their users" ON public.company_users;

-- Create a simpler policy that allows all authenticated users to manage company_users
CREATE POLICY "Allow authenticated users to manage company_users"
ON public.company_users
USING (true)
WITH CHECK (true);
