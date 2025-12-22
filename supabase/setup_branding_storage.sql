-- Create the storage bucket for agency branding if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-branding', 'agency-branding', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to all files in the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'agency-branding' );

-- Policy: Allow authenticated users to upload files to their own folder (or just generally if we want to be less strict for now, but folder ownership is better)
-- We will assume the file path is `{user_id}/{filename}`
CREATE POLICY "Agents can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agency-branding' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Agents can update/delete their own logos
CREATE POLICY "Agents can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agency-branding' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Agents can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agency-branding' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
