-- Create tables
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ico TEXT NOT NULL UNIQUE,
  dic TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  sector TEXT NOT NULL,
  verification_methods TEXT[] NOT NULL,
  integration_type TEXT NOT NULL,
  pricing_plan TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT status_check CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT type_check CHECK (type IN ('credit', 'debit')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  result TEXT NOT NULL,
  price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT method_check CHECK (method IN ('bankid', 'mojeid', 'ocr', 'facescan')),
  CONSTRAINT result_check CHECK (result IN ('success', 'failure'))
);

CREATE TABLE customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  font TEXT NOT NULL,
  button_style TEXT NOT NULL,
  verification_methods TEXT[] NOT NULL,
  failure_action TEXT NOT NULL,
  failure_redirect TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT failure_action_check CHECK (failure_action IN ('redirect', 'block'))
);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customizations_updated_at
  BEFORE UPDATE ON customizations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_shops_company_id ON shops(company_id);
CREATE INDEX idx_wallet_transactions_company_id ON wallet_transactions(company_id);
CREATE INDEX idx_verifications_shop_id ON verifications(shop_id);
CREATE INDEX idx_customizations_shop_id ON customizations(shop_id);

-- Create RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customizations ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Companies are viewable by owner"
ON companies FOR SELECT
USING (auth.uid() IN (
  SELECT company_id FROM user_companies WHERE user_id = auth.uid()
));

-- Shops policies
CREATE POLICY "Shops are viewable by company owner"
ON shops FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_companies WHERE user_id = auth.uid()
));

-- Wallet transactions policies
CREATE POLICY "Wallet transactions are viewable by company owner"
ON wallet_transactions FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_companies WHERE user_id = auth.uid()
));

-- Verifications policies
CREATE POLICY "Verifications are viewable by shop owner"
ON verifications FOR SELECT
USING (shop_id IN (
  SELECT id FROM shops WHERE company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
));

-- Customizations policies
CREATE POLICY "Customizations are viewable by shop owner"
ON customizations FOR SELECT
USING (shop_id IN (
  SELECT id FROM shops WHERE company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
));

