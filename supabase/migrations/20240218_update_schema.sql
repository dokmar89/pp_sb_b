-- Add user_id column to companies table
ALTER TABLE public.companies
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update RLS policies for companies
DROP POLICY IF EXISTS "Companies are viewable by owner" ON public.companies;
CREATE POLICY "Companies are viewable by owner"
ON public.companies FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create policy for inserting companies
DROP POLICY IF EXISTS "Companies can be created by anyone" ON public.companies;
CREATE POLICY "Companies can be created by anyone"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update RLS policies for shops
DROP POLICY IF EXISTS "Shops are viewable by company owner" ON public.shops;
CREATE POLICY "Shops are viewable by company owner"
ON public.shops FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT id FROM public.companies WHERE user_id = auth.uid()
));

-- Update RLS policies for wallet_transactions
DROP POLICY IF EXISTS "Wallet transactions are viewable by company owner" ON public.wallet_transactions;
CREATE POLICY "Wallet transactions are viewable by company owner"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT id FROM public.companies WHERE user_id = auth.uid()
));

-- Update RLS policies for verifications
DROP POLICY IF EXISTS "Verifications are viewable by shop owner" ON public.verifications;
CREATE POLICY "Verifications are viewable by shop owner"
ON public.verifications FOR SELECT
TO authenticated
USING (shop_id IN (
  SELECT id FROM public.shops WHERE company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
));

-- Update RLS policies for customizations
DROP POLICY IF EXISTS "Customizations are viewable by shop owner" ON public.customizations;
CREATE POLICY "Customizations are viewable by shop owner"
ON public.customizations FOR SELECT
TO authenticated
USING (shop_id IN (
  SELECT id FROM public.shops WHERE company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
));

