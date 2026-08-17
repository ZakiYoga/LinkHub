DROP INDEX IF EXISTS idx_menu_items_url_active;
CREATE UNIQUE INDEX idx_menu_items_url ON menu_items(url);
