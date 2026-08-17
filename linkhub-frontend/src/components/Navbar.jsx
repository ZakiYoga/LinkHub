import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, selectIsAuthed, selectIsAdmin } from "../stores/authStore";

export default function Navbar() {
  const isAuthed = useAuthStore(selectIsAuthed);
  const isAdmin = useAuthStore(selectIsAdmin);
  const role = useAuthStore((s) => s.user?.role);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-slate-900">
          LinkHub
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {isAuthed ? (
            <>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 hidden sm:inline">
                {role}
              </span>
              <Link to="/trash" className="text-slate-600 hover:text-slate-900">
                Sampah
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin/tags" className="text-slate-600 hover:text-slate-900">
                    Kelola Tag
                  </Link>
                  <Link to="/admin/users" className="text-slate-600 hover:text-slate-900">
                    Kelola User
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="text-red-600 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-slate-600 hover:text-slate-900">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
