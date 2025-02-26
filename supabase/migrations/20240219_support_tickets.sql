-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger for support_tickets
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id ON support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Support tickets are viewable by company owner"
    ON support_tickets FOR SELECT
    USING (company_id IN (
        SELECT id FROM companies
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Support tickets can be created by company owner"
    ON support_tickets FOR INSERT
    WITH CHECK (company_id IN (
        SELECT id FROM companies
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Support messages are viewable by ticket owner"
    ON support_messages FOR SELECT
    USING (ticket_id IN (
        SELECT id FROM support_tickets
        WHERE company_id IN (
            SELECT id FROM companies
            WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Support messages can be created by ticket owner"
    ON support_messages FOR INSERT
    WITH CHECK (ticket_id IN (
        SELECT id FROM support_tickets
        WHERE company_id IN (
            SELECT id FROM companies
            WHERE user_id = auth.uid()
        )
    ));

