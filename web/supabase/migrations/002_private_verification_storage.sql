-- AegisPay client evidence storage for the fresh React portal.
-- Apply this migration to the connected Supabase project before enabling deposit/KYC uploads.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES (
  'private-verification',
  'private-verification',
  FALSE,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public=FALSE,
  file_size_limit=10485760,
  allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS verification_upload_own ON storage.objects;
CREATE POLICY verification_upload_own
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id='private-verification'
  AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
);

DROP POLICY IF EXISTS verification_read_own_or_master ON storage.objects;
CREATE POLICY verification_read_own_or_master
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id='private-verification'
  AND (
    (storage.foldername(name))[1]=(SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id=auth.uid() AND u.role='MASTER ADMIN'
    )
  )
);

DROP POLICY IF EXISTS verification_delete_own ON storage.objects;
CREATE POLICY verification_delete_own
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id='private-verification'
  AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
);
