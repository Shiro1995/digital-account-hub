
-- Fix 1: Replace overly permissive INSERT policy on support_messages
DROP POLICY "Anyone can submit support" ON public.support_messages;
CREATE POLICY "Anyone can submit support" ON public.support_messages FOR INSERT
  WITH CHECK (
    length(name) > 0 AND length(name) <= 200
    AND length(email) > 0 AND length(email) <= 200
    AND length(subject) > 0 AND length(subject) <= 500
    AND length(message) > 0 AND length(message) <= 5000
  );

-- Fix 2: Replace broad SELECT on storage.objects for product-images
DROP POLICY "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] IS NOT NULL);
