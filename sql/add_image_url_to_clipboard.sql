-- Add image_url to sys_clipboard
ALTER TABLE sys_clipboard ADD COLUMN IF NOT EXISTS image_url TEXT;
