-- Add company_slug column to sponsor_profiles
ALTER TABLE sponsor_profiles 
ADD COLUMN IF NOT EXISTS company_slug text;

-- Generate unique slugs for existing records with a row number suffix for duplicates
WITH numbered_profiles AS (
  SELECT 
    id,
    company_name,
    ROW_NUMBER() OVER (PARTITION BY lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g')) ORDER BY created_at) as rn
  FROM sponsor_profiles
)
UPDATE sponsor_profiles sp
SET company_slug = CASE 
  WHEN np.rn = 1 THEN lower(regexp_replace(np.company_name, '[^a-zA-Z0-9]+', '-', 'g'))
  ELSE lower(regexp_replace(np.company_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || np.rn
END
FROM numbered_profiles np
WHERE sp.id = np.id AND sp.company_slug IS NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS sponsor_profiles_company_slug_key 
ON sponsor_profiles(company_slug);

-- Make slug NOT NULL after populating existing data
ALTER TABLE sponsor_profiles 
ALTER COLUMN company_slug SET NOT NULL;

-- Add function to auto-generate slug from company name
CREATE OR REPLACE FUNCTION generate_company_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  IF NEW.company_slug IS NULL OR NEW.company_slug = '' THEN
    base_slug := lower(regexp_replace(NEW.company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    final_slug := base_slug;
    
    -- Check if slug exists and append number if needed
    WHILE EXISTS (SELECT 1 FROM sponsor_profiles WHERE company_slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.company_slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to auto-generate slug on insert
DROP TRIGGER IF EXISTS set_company_slug_before_insert ON sponsor_profiles;
CREATE TRIGGER set_company_slug_before_insert
BEFORE INSERT ON sponsor_profiles
FOR EACH ROW
EXECUTE FUNCTION generate_company_slug();

-- Add trigger to update slug when company name changes
DROP TRIGGER IF EXISTS update_company_slug_before_update ON sponsor_profiles;
CREATE TRIGGER update_company_slug_before_update
BEFORE UPDATE ON sponsor_profiles
FOR EACH ROW
WHEN (OLD.company_name IS DISTINCT FROM NEW.company_name)
EXECUTE FUNCTION generate_company_slug();