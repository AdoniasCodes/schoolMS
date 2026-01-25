-- Add update_id column to media_assets
ALTER TABLE media_assets 
ADD COLUMN update_id UUID 
REFERENCES daily_updates(id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_media_assets_update_id ON media_assets(update_id);
