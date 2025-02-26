-- Drop existing policies
DROP POLICY IF EXISTS "Companies are viewable by owner" ON public.companies;
DROP POLICY IF EXISTS "Shops are viewable by company owner" ON public.shops;
DROP POLICY IF EXISTS "Wallet transactions are viewable by company owner" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Verifications are viewable by shop owner" ON public.verifications;
DROP POLICY IF EXISTS "Customizations are viewable by shop owner" ON public.customizations;

-- Add user_id column to companies if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'companies' AND column_name = 'user_id') THEN
        ALTER TABLE public.companies ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update existing companies to link with auth users
UPDATE public.companies
SET user_id = auth.users.id
FROM auth.users
WHERE companies.email = auth.users.email AND companies.user_id IS NULL;

-- Create new RLS policies
CREATE POLICY "Companies are viewable by owner"
ON public.companies FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Shops are viewable by company owner"
ON public.shops FOR SELECT
USING (company_id IN (
    SELECT id FROM public.companies
    WHERE user_id = auth.uid()
));

CREATE POLICY "Wallet transactions are viewable by company owner"
ON public.wallet_transactions FOR SELECT
USING (company_id IN (
    SELECT id FROM public.companies
    WHERE user_id = auth.uid()
));

CREATE POLICY "Verifications are viewable by shop owner"
ON public.verifications FOR SELECT
USING (shop_id IN (
    SELECT id FROM public.shops
    WHERE company_id IN (
        SELECT id FROM public.companies
        WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Customizations are viewable by shop owner"
ON public.customizations FOR SELECT
USING (shop_id IN (
    SELECT id FROM public.shops
    WHERE company_id IN (
        SELECT id FROM public.companies
        WHERE user_id = auth.uid()
    )
));

-- Add policies for insert
CREATE POLICY "Companies can be created by authenticated users"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shops can be created by company owner"
ON public.shops FOR INSERT
WITH CHECK (company_id IN (
    SELECT id FROM public.companies
    WHERE user_id = auth.uid()
));

CREATE POLICY "Wallet transactions can be created by company owner"
ON public.wallet_transactions FOR INSERT
WITH CHECK (company_id IN (
    SELECT id FROM public.companies
    WHERE user_id = auth.uid()
));

