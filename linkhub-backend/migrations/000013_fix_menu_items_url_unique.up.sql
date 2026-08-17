ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_url_key;

DROP INDEX IF EXISTS idx_menu_items_url_active;
CREATE UNIQUE INDEX idx_menu_items_url_active
    ON menu_items(url)
    WHERE deleted_at IS NULL;