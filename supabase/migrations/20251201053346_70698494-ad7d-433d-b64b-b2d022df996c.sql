-- Add policy for users to view files shared with them
CREATE POLICY "Users can view files shared with them"
  ON public.encrypted_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.file_shares
      WHERE file_shares.file_id = encrypted_files.id
      AND file_shares.shared_with_email = (auth.jwt() ->> 'email')
    )
  );