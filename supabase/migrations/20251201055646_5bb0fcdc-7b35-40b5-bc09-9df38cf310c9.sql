-- Create user_keys table to store public keys
CREATE TABLE public.user_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_keys
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

-- Anyone can view public keys (they're public!)
CREATE POLICY "Public keys are viewable by everyone"
  ON public.user_keys FOR SELECT
  USING (true);

-- Users can insert their own public key
CREATE POLICY "Users can insert their own public key"
  ON public.user_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own public key
CREATE POLICY "Users can update their own public key"
  ON public.user_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Modify encrypted_files to store encrypted symmetric key instead of plain key
-- The encrypted_key column will now store the AES key encrypted with owner's public RSA key
COMMENT ON COLUMN public.encrypted_files.encrypted_key IS 'AES symmetric key encrypted with owner RSA public key';

-- Add encrypted_key column to file_shares for recipient-specific encryption
ALTER TABLE public.file_shares ADD COLUMN IF NOT EXISTS encrypted_key TEXT;

COMMENT ON COLUMN public.file_shares.encrypted_key IS 'AES symmetric key encrypted with recipient RSA public key';