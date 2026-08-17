DROP INDEX IF EXISTS idx_menu_items_deleted_at;
DROP INDEX IF EXISTS idx_folders_deleted_at;

ALTER TABLE menu_items DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE menu_items DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE menu_items DROP COLUMN IF EXISTS updated_by;

ALTER TABLE folders DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE folders DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE folders DROP COLUMN IF EXISTS updated_by;
