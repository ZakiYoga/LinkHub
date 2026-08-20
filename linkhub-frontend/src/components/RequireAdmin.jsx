import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, selectIsAdmin } from "../stores/authStore";

export default function RequireAdmin({ children }) {
  const isAdmin = useAuthStore(selectIsAdmin);
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

RequireAdmin.propTypes = {
  children: PropTypes.node.isRequired,
};