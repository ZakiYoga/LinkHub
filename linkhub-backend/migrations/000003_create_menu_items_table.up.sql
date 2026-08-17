CREATE TABLE menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    url varchar(2048) NOT NULL UNIQUE,
    type varchar(50) NOT NULL,
    folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
    description text,
    created_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_items_folder_id ON menu_items(folder_id);
CREATE INDEX idx_menu_items_type ON menu_items(type);
