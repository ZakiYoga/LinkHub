-- Replace the plain unique index with a partial one so a URL can be
-- reused after the row that held it is soft-deleted (design doc
-- section 6). The original index was created implicitly by GORM's
-- `uniqueIndex` tag before this migration; drop it by its default name.
DROP INDEX IF EXISTS idx_menu_items_url;

CREATE UNIQUE INDEX idx_menu_items_url_active
    ON menu_items(url)
    WHERE deleted_at IS NULL;
