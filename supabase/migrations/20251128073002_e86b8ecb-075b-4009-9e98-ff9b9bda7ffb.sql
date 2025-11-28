-- Create table for storing encrypted files metadata
CREATE TABLE public.encrypted_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  encrypted_key TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for file shares
CREATE TABLE public.file_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.encrypted_files(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(file_id, shared_with_email)
);

-- Enable RLS
ALTER TABLE public.encrypted_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for encrypted_files
CREATE POLICY "Users can view their own files"
  ON public.encrypted_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON public.encrypted_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON public.encrypted_files FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for file_shares
CREATE POLICY "Users can view shares they created"
  ON public.file_shares FOR SELECT
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can view files shared with them"
  ON public.file_shares FOR SELECT
  USING (
    auth.jwt() ->> 'email' = shared_with_email
  );

CREATE POLICY "Users can create shares for their files"
  ON public.file_shares FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM public.encrypted_files
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own shares"
  ON public.file_shares FOR DELETE
  USING (auth.uid() = shared_by);