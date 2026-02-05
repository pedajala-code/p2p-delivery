-- STEP 4: Storage Policies (with DROP IF EXISTS)

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can upload own ID verifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own ID verifications" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload delivery proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view delivery proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;

-- Storage policies
CREATE POLICY "Users can upload own ID verifications"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'id-verifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own ID verifications"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'id-verifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated users can upload delivery proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-proofs' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view delivery proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'delivery-proofs' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );
