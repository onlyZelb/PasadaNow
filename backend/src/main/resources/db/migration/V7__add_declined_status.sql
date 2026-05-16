ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;
ALTER TABLE rides ADD CONSTRAINT rides_status_check 
CHECK (status IN ('pending','accepted','ongoing','completed','cancelled','declined'));