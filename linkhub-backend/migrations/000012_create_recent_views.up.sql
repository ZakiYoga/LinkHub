CREATE TABLE recent_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type varchar(50) NOT NULL,
    entity_id uuid NOT NULL,
    entity_name varchar(255),
    viewed_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX idx_recent_views_user ON recent_views(user_id, viewed_at DESC);
