-- Create billing_info table
CREATE TABLE IF NOT EXISTS public.billing_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  ico TEXT NOT NULL,
  dic TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_info_company_id ON public.billing_info(company_id);

-- Add RLS policies
ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;

-- Policy for selecting billing info (company owners can see their billing info)
CREATE POLICY "Company owners can view their billing info" 
ON public.billing_info 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.companies WHERE id = company_id
  )
);

-- Policy for inserting billing info (company owners can add billing info to their company)
CREATE POLICY "Company owners can add billing info" 
ON public.billing_info 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.companies WHERE id = company_id
  )
);

-- Policy for updating billing info (company owners can update their billing info)
CREATE POLICY "Company owners can update their billing info" 
ON public.billing_info 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.companies WHERE id = company_id
  )
);

-- Policy for deleting billing info (company owners can delete their billing info)
CREATE POLICY "Company owners can delete their billing info" 
ON public.billing_info 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.companies WHERE id = company_id
  )
);
