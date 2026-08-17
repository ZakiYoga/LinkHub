import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuthStore, selectIsAuthed } from "../stores/authStore";

// Inverse of RequireAuth: keeps an already-logged-in user (staff or
// admin) away from /login by bouncing them back to the landing page.
export default function RedirectIfAuthed({ children }) {
  const isAuthed = useAuthStore(selectIsAuthed);

  if (isAuthed) {
    return <Navigate to="/" replace />;
  }
  return children;
}

RedirectIfAuthed.propTypes = {
  children: PropTypes.node.isRequired,
};
