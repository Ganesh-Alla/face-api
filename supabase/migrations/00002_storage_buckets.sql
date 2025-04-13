-- Create storage buckets for photos, faces, and event covers
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('photos', 'photos', true, false, 10485760, -- 10MB limit
    '{image/png,image/jpeg,image/jpg,image/webp,image/gif}'),
  ('faces', 'faces', true, false, 5242880, -- 5MB limit
    '{image/png,image/jpeg,image/jpg,image/webp}'),
  ('event_covers', 'event_covers', true, false, 10485760, -- 10MB limit
    '{image/png,image/jpeg,image/jpg,image/webp,image/gif}')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage buckets
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Set up simplified storage policies for photos bucket
-- Anyone can read photos (we'll control access at the database level)
CREATE POLICY "Public Access to Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- Users can update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up simplified storage policies for faces bucket
-- Anyone can view faces
CREATE POLICY "Public Access to Faces"
ON storage.objects FOR SELECT
USING (bucket_id = 'faces');

-- Authenticated users can upload faces
CREATE POLICY "Authenticated users can upload faces"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'faces' AND
  auth.role() = 'authenticated'
);

-- Users can update their own faces
CREATE POLICY "Users can update their own faces"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'faces' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own faces
CREATE POLICY "Users can delete their own faces"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'faces' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up simplified storage policies for event covers bucket
-- Anyone can view event covers
CREATE POLICY "Public Access to Event Covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'event_covers');

-- Authenticated users can upload event covers
CREATE POLICY "Authenticated users can upload event covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event_covers' AND
  auth.role() = 'authenticated'
);

-- Users can update their own event covers
CREATE POLICY "Users can update their own event covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event_covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own event covers
CREATE POLICY "Users can delete their own event covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event_covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage helper functions
-- Function to get the path for storing a photo
CREATE OR REPLACE FUNCTION get_photo_storage_path(user_id UUID, event_id UUID, filename TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id || '/' || event_id || '/' || filename;
END;
$$ LANGUAGE plpgsql;

-- Function to get the path for storing a face
CREATE OR REPLACE FUNCTION get_face_storage_path(user_id UUID, event_id UUID, photo_id UUID, face_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id || '/' || event_id || '/' || photo_id || '/' || face_id || '.jpg';
END;
$$ LANGUAGE plpgsql;

-- Function to get the path for storing an event cover
CREATE OR REPLACE FUNCTION get_event_cover_storage_path(user_id UUID, event_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id || '/' || event_id || '/cover.jpg';
END;
$$ LANGUAGE plpgsql;
