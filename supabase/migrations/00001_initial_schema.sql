-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create users table (profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,
  requires_face_auth BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create photos table with semantic search fields
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  filename TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  -- Semantic search fields
  context TEXT,
  keywords TEXT[],
  event_type TEXT,
  people_count INTEGER,
  setting TEXT,
  colors TEXT[],
  objects TEXT[],
  mood TEXT,
  context_text TEXT,
  embedding vector(768), -- For Gemini embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create faces table
CREATE TABLE IF NOT EXISTS faces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  face_image_url TEXT NOT NULL,
  descriptor TEXT NOT NULL, -- Stored as comma-separated string
  confidence REAL NOT NULL,
  person_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create face profiles table for recognizing people
CREATE TABLE IF NOT EXISTS face_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  profile_image_url TEXT,
  descriptors TEXT[] NOT NULL, -- Array of descriptor strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to generate a TSVector from context_text
CREATE OR REPLACE FUNCTION photos_search_vector(context_text TEXT)
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector('english', context_text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a generated column for the search vector
ALTER TABLE photos 
  ADD COLUMN IF NOT EXISTS search_vector tsvector 
  GENERATED ALWAYS AS (photos_search_vector(context_text)) STORED;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS photos_search_idx ON photos USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS photos_event_id_idx ON photos(event_id);
CREATE INDEX IF NOT EXISTS photos_embedding_idx ON photos USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS faces_photo_id_idx ON faces(photo_id);
CREATE INDEX IF NOT EXISTS faces_person_id_idx ON faces(person_id);

-- Create view to get event photo counts
CREATE OR REPLACE VIEW event_photo_counts AS
SELECT 
  event_id, 
  COUNT(*) as photo_count
FROM 
  photos
GROUP BY 
  event_id;

-- RLS Policies
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public events"
  ON events FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view events they have access to via share_code"
  ON events FOR SELECT
  USING (
    share_code IN (
      SELECT share_code FROM event_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- Photos policies
CREATE POLICY "Users can view photos from their own events"
  ON photos FOR SELECT
  USING (
    user_id = auth.uid() OR
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view photos from public events"
  ON photos FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE is_public = true
    )
  );

CREATE POLICY "Users can view photos from events they have access to"
  ON photos FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN event_access ea ON e.id = ea.event_id
      WHERE ea.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload photos to their own events"
  ON photos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos in their own events"
  ON photos FOR UPDATE
  USING (
    auth.uid() = user_id OR
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from their own events"
  ON photos FOR DELETE
  USING (
    auth.uid() = user_id OR
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Faces policies
CREATE POLICY "Users can view faces from photos they can access"
  ON faces FOR SELECT
  USING (
    photo_id IN (
      SELECT id FROM photos WHERE 
      user_id = auth.uid() OR
      event_id IN (
        SELECT id FROM events WHERE user_id = auth.uid() OR is_public = true
      ) OR
      event_id IN (
        SELECT e.id FROM events e
        JOIN event_access ea ON e.id = ea.event_id
        WHERE ea.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create faces"
  ON faces FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update faces in their events"
  ON faces FOR UPDATE
  USING (
    auth.uid() = user_id OR
    photo_id IN (
      SELECT id FROM photos WHERE 
      event_id IN (
        SELECT id FROM events WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete faces from their events"
  ON faces FOR DELETE
  USING (
    auth.uid() = user_id OR
    photo_id IN (
      SELECT id FROM photos WHERE 
      event_id IN (
        SELECT id FROM events WHERE user_id = auth.uid()
      )
    )
  );

-- Face profiles policies
CREATE POLICY "Users can view their own face profiles"
  ON face_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own face profiles"
  ON face_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own face profiles"
  ON face_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own face profiles"
  ON face_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Create event_access table for shared events
CREATE TABLE IF NOT EXISTS event_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event access"
  ON event_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Event owners can manage event access"
  ON event_access FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Create functions for semantic search
CREATE OR REPLACE FUNCTION search_photos_by_text(search_query TEXT)
RETURNS SETOF photos AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM photos p
  WHERE p.search_vector @@ to_tsquery('english', search_query)
  ORDER BY ts_rank(p.search_vector, to_tsquery('english', search_query)) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION search_photos_by_embedding(query_embedding vector(768), match_threshold float, match_count int)
RETURNS TABLE(
  id UUID,
  url TEXT,
  event_id UUID,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.url,
    p.event_id,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM photos p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_faces_updated_at
  BEFORE UPDATE ON faces
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_face_profiles_updated_at
  BEFORE UPDATE ON face_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Vector similarity search
CREATE OR REPLACE FUNCTION search_photos_by_embedding(query_embedding vector(768), match_threshold float, match_count int)
RETURNS TABLE(
  id UUID,
  url TEXT,
  event_id UUID,
  similarity float
) AS $$

-- Text search
SELECT * FROM search_photos_by_text('beach sunset');

-- Vector search (after generating embeddings)
SELECT * FROM search_photos_by_embedding(query_embedding, 0.7, 10);
