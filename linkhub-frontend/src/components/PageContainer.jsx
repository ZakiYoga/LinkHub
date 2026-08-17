import PropTypes from "prop-types";

const SIZES = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
};

export default function PageContainer({ size = "md", className = "", children }) {
  return (
    <div className={`${SIZES[size]} min-h-[calc(100vh-4rem)] mx-auto px-4 sm:px-6 py-8 ${className}`}>
      {children}
    </div>
  );
}

PageContainer.propTypes = {
  size: PropTypes.oneOf(Object.keys(SIZES)),
  className: PropTypes.string,
  children: PropTypes.node,
};