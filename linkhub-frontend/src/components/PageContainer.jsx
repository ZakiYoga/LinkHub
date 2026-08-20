import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
};

export default function PageContainer({ size = "md", className = "", children }) {
  return (
    <div
      className={cn(
        SIZES[size],
        "mx-auto min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6",
        className
      )}
    >
      {children}
    </div>
  );
}

PageContainer.propTypes = {
  size: PropTypes.oneOf(Object.keys(SIZES)),
  className: PropTypes.string,
  children: PropTypes.node,
};