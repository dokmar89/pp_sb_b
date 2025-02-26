-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ico TEXT NOT NULL UNIQUE,
  dic TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  sector TEXT NOT NULL,
  verification_methods TEXT[] NOT NULL,
  integration_type TEXT NOT NULL,
  pricing_plan TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT status_check CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT type_check CHECK (type IN ('credit', 'debit')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  result TEXT NOT NULL,
  price DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT method_check CHECK (method IN ('bankid', 'mojeid', 'ocr', 'facescan')),
  CONSTRAINT result_check CHECK (result IN ('success', 'failure'))
);

CREATE TABLE IF NOT EXISTS public.customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  font TEXT NOT NULL,
  button_style TEXT NOT NULL,
  verification_methods TEXT[] NOT NULL,
  failure_action TEXT NOT NULL,
  failure_redirect TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT failure_action_check CHECK (failure_action IN ('redirect', 'block'))
);

-- Create function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_customizations_updated_at
  BEFORE UPDATE ON public.customizations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_shops_company_id ON public.shops(company_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_company_id ON public.wallet_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_verifications_shop_id ON public.verifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_customizations_shop_id ON public.customizations(shop_id);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Companies are viewable by owner"
ON public.companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Shops are viewable by company owner"
ON public.shops FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Wallet transactions are viewable by company owner"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Verifications are viewable by shop owner"
ON public.verifications FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Customizations are viewable by shop owner"
ON public.customizations FOR SELECT
TO authenticated
USING (true);

-- Insert policies
CREATE POLICY "Companies can be created by anyone"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Shops can be created by company owner"
ON public.shops FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Wallet transactions can be created by system"
ON public.wallet_transactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Verifications can be created by system"
ON public.verifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Customizations can be created by shop owner"
ON public.customizations FOR INSERT
TO authenticated
WITH CHECK (true);

