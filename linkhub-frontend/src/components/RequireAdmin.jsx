import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

// Route guard: redirects to /login if not authenticated as admin.
// Wrap any admin-only <Route element={...}> with this component.
export default function RequireAdmin({ children }) {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

RequireAdmin.propTypes = {
  children: PropTypes.node.isRequired,
};
