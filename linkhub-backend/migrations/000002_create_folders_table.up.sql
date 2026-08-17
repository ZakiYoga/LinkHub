CREATE TABLE folders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
    created_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_folders_parent_id ON folders(parent_id);
