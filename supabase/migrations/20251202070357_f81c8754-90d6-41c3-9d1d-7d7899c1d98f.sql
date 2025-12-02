-- Add expires_at column to file_shares table
ALTER TABLE public.file_shares 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policy to exclude expired shares for recipients
DROP POLICY IF EXISTS "Users can view files shared with them" ON public.file_shares;
CREATE POLICY "Users can view files shared with them"
ON public.file_shares
FOR SELECT
USING (
  (auth.jwt() ->> 'email'::text) = shared_with_email
  AND (expires_at IS NULL OR expires_at > now())
);

-- Update RLS policy for viewing shared files in encrypted_files table
DROP POLICY IF EXISTS "Users can view files shared with them" ON public.encrypted_files;
CREATE POLICY "Users can view files shared with them"
ON public.encrypted_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM file_shares
    WHERE file_shares.file_id = encrypted_files.id
      AND file_shares.shared_with_email = (auth.jwt() ->> 'email'::text)
      AND (file_shares.expires_at IS NULL OR file_shares.expires_at > now())
  )
);