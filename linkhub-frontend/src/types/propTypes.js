import PropTypes from "prop-types";

export const folderShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  parent_id: PropTypes.string,
  created_by: PropTypes.string,
  pin_protected: PropTypes.bool,
});

export const menuItemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  type: PropTypes.oneOf([
    "spreadsheet",
    "slides",
    "drive",
    "document",
    "form",
    "other",
  ]).isRequired,
  folder_id: PropTypes.string,
  description: PropTypes.string,
  tags: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
  ),
});
