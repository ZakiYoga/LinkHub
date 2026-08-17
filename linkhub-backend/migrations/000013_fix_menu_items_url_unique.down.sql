DROP INDEX IF EXISTS idx_menu_items_url_active;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_url_key UNIQUE (url);