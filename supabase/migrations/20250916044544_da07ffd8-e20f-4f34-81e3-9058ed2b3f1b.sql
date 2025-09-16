-- Enable realtime for marketplace tables (skip rewards which is already added)
ALTER TABLE marketplace_listings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_listings;

ALTER TABLE reward_redemptions REPLICA IDENTITY FULL; 
ALTER PUBLICATION supabase_realtime ADD TABLE reward_redemptions;

-- Add marketplace listing functionality to reward redemptions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_redemptions' AND column_name = 'can_be_listed') THEN
    ALTER TABLE reward_redemptions ADD COLUMN can_be_listed BOOLEAN DEFAULT true;
    ALTER TABLE reward_redemptions ADD COLUMN is_listed_on_marketplace BOOLEAN DEFAULT false;
    ALTER TABLE reward_redemptions ADD COLUMN marketplace_listing_id UUID REFERENCES marketplace_listings(id);
  END IF;
END $$;