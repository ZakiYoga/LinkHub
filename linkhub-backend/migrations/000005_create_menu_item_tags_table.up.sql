CREATE TABLE menu_item_tags (
    menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_item_id, tag_id)
);
