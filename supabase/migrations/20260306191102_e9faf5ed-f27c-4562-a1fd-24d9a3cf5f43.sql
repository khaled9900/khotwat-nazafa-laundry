INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

CREATE POLICY "Anyone can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Anyone can update company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets');

CREATE POLICY "Anyone can read company assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');

CREATE POLICY "Anyone can delete company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');