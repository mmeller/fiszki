-- Enhanced Supabase Schema with Sharing Features (No Social Features)
-- This adds public/shared word list capabilities to the Fiszki app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add visibility column to categories table
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared'));

-- Create a table to track who has imported shared categories
CREATE TABLE IF NOT EXISTS category_imports (
  id BIGSERIAL PRIMARY KEY,
  original_category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  imported_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  imported_category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_category_id, imported_by_user_id)
);

-- Create indexes for new table
CREATE INDEX IF NOT EXISTS idx_category_imports_original ON category_imports(original_category_id);
CREATE INDEX IF NOT EXISTS idx_category_imports_user ON category_imports(imported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_categories_visibility ON categories(visibility);

-- Enable RLS on new table
ALTER TABLE category_imports ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for categories to support public visibility

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

-- New policies for categories with visibility support
CREATE POLICY "Users can view own and public categories" ON categories
  FOR SELECT
  USING (
    auth.uid() = user_id OR visibility IN ('public', 'shared')
  );

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update policies for words to support public categories
DROP POLICY IF EXISTS "Users can view own words" ON words;
DROP POLICY IF EXISTS "Users can insert own words" ON words;
DROP POLICY IF EXISTS "Users can update own words" ON words;
DROP POLICY IF EXISTS "Users can delete own words" ON words;

CREATE POLICY "Users can view own words and words from public categories" ON words
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR category_id IN (
      SELECT id FROM categories WHERE visibility IN ('public', 'shared')
    )
  );

CREATE POLICY "Users can insert own words" ON words
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own words" ON words
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own words" ON words
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for category_imports
CREATE POLICY "Users can view own imports" ON category_imports
  FOR SELECT
  USING (auth.uid() = imported_by_user_id);

CREATE POLICY "Users can create imports" ON category_imports
  FOR INSERT
  WITH CHECK (auth.uid() = imported_by_user_id);

CREATE POLICY "Users can delete own imports" ON category_imports
  FOR DELETE
  USING (auth.uid() = imported_by_user_id);

-- Create a view for public categories
CREATE OR REPLACE VIEW public_categories AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.description,
  c.lang1,
  c.lang2,
  c.created_at,
  get_category_word_count(c.id) as word_count,
  EXISTS(
    SELECT 1 FROM category_imports 
    WHERE original_category_id = c.id AND imported_by_user_id = auth.uid()
  ) as is_imported_by_me
FROM categories c
WHERE c.visibility IN ('public', 'shared')
ORDER BY c.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public_categories TO authenticated;

-- Comments for documentation
COMMENT ON COLUMN categories.visibility IS 'private: only owner can see, public: everyone can see and import, shared: reserved for future use';
COMMENT ON TABLE category_imports IS 'Tracks which users have imported which shared categories';
