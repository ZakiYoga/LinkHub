import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Breadcrumb({ items }) {
  return (
    <BreadcrumbRoot className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Root</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((f) => (
          <span key={f.id} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/folder/${f.id}`}>{f.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}

Breadcrumb.propTypes = {
  items: PropTypes.array.isRequired,
};