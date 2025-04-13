-- Update the photos table to include fields for semantic search
ALTER TABLE photos 
  ADD COLUMN IF NOT EXISTS context TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS people_count INTEGER,
  ADD COLUMN IF NOT EXISTS setting TEXT,
  ADD COLUMN IF NOT EXISTS colors TEXT[],
  ADD COLUMN IF NOT EXISTS objects TEXT[],
  ADD COLUMN IF NOT EXISTS mood TEXT,
  ADD COLUMN IF NOT EXISTS context_text TEXT;

-- Create a function to generate a TSVector from context_text
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

-- Create an index on the search vector for faster searches
CREATE INDEX IF NOT EXISTS photos_search_idx ON photos USING GIN (search_vector);
