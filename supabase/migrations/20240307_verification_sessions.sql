-- Create verification_sessions table
CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  shop_id UUID NOT NULL REFERENCES shops(id),
  verification_id UUID REFERENCES verifications(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS verification_sessions_session_id_idx ON verification_sessions(session_id);
CREATE INDEX IF NOT EXISTS verification_sessions_shop_id_idx ON verification_sessions(shop_id);

-- Add RLS policies
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public access for session creation and updates
CREATE POLICY "Allow public access to verification_sessions"
  ON verification_sessions
  FOR ALL
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_verification_sessions_updated_at
BEFORE UPDATE ON verification_sessions
FOR EACH ROW
EXECUTE FUNCTION update_verification_sessions_updated_at(); 