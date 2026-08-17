import PropTypes from "prop-types";
import sheetsIcon from "../assets/icons/google-sheets.webp";
import slidesIcon from "../assets/icons/google-slides.webp";
import driveIcon from "../assets/icons/google-drive.webp";
import docsIcon from "../assets/icons/google-docs.webp";
import formsIcon from "../assets/icons/google-forms.webp";
import linkIcon from "../assets/icons/linked.webp";

const ICON_MAP = {
  spreadsheet: sheetsIcon,
  slides: slidesIcon,
  drive: driveIcon,
  document: docsIcon,
  form: formsIcon,
  other: linkIcon,
};

export default function ItemIcon({ type, className }) {
  const src = ICON_MAP[type] || linkIcon;
  return <img src={src} alt="" className={className} />;
}

ItemIcon.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string,
};