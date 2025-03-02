-- Create company_users table
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  position TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);

-- Create unique index on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_users_email ON public.company_users(email);

-- Add RLS policies
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Policy for selecting users (company owners can see their company's users)
CREATE POLICY "Company owners can view their users" 
ON public.company_users 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.companies WHERE id = company_id
  )
);

-- Policy for inserting users (company owners can add users to their company)
CREATE POLICY "Company owners can add users" 
ON public.company_users 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.companies WHERE id = company_id
  )
);

-- Policy for updating users (company owners can update their company's users)
CREATE POLICY "Company owners can update their users" 
ON public.company_users 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.companies WHERE id = company_id
  )
);

-- Policy for deleting users (company owners can delete their company's users)
CREATE POLICY "Company owners can delete their users" 
ON public.company_users 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.companies WHERE id = company_id
  )
);
