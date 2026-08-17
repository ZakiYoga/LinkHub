import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-sm text-slate-500 mb-4">
      <Link to="/" className="hover:text-slate-800">
        Root
      </Link>
      {items.map((f) => (
        <span key={f.id} className="flex items-center gap-1">
          <span>/</span>
          <Link to={`/folder/${f.id}`} className="hover:text-slate-800">
            {f.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}

Breadcrumb.propTypes = {
  items: PropTypes.array.isRequired,
};
