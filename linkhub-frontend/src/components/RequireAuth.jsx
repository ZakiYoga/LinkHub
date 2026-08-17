import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, selectIsAuthed } from "../stores/authStore";

// Like RequireAdmin, but for routes any logged-in role (staff or
// admin) may access — e.g. the Trash page.
export default function RequireAuth({ children }) {
  const isAuthed = useAuthStore(selectIsAuthed);
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
};
