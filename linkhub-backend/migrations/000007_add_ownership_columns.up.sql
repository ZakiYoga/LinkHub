ALTER TABLE folders
    ADD COLUMN updated_by uuid REFERENCES users(id),
    ADD COLUMN deleted_at timestamptz,
    ADD COLUMN deleted_by uuid REFERENCES users(id);

ALTER TABLE menu_items
    ADD COLUMN updated_by uuid REFERENCES users(id),
    ADD COLUMN deleted_at timestamptz,
    ADD COLUMN deleted_by uuid REFERENCES users(id);

-- Speeds up "WHERE deleted_at IS NULL" filters used everywhere once
-- soft delete is in play.
CREATE INDEX idx_folders_deleted_at ON folders(deleted_at);
CREATE INDEX idx_menu_items_deleted_at ON menu_items(deleted_at);
