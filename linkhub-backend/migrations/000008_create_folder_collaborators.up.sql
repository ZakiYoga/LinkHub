CREATE TABLE folder_collaborators (
    folder_id uuid NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by  uuid NOT NULL REFERENCES users(id),
    added_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (folder_id, user_id)
);

CREATE INDEX idx_folder_collaborators_user_id ON folder_collaborators(user_id);
