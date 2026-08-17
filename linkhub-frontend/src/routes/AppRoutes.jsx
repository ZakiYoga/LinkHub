import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import FolderPage from "../pages/FolderPage.jsx";
import SearchResultsPage from "../pages/SearchResultsPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RequireAdmin from "../components/RequireAdmin.jsx";
import RequireAuth from "../components/RequireAuth.jsx";
import RedirectIfAuthed from "../components/RedirectIfAuthed.jsx";

// Admin-only / login-only pages are code-split so guests (the far more
// common visitor, per design doc section 17) never download their bundles.
const AdminTagsPage = lazy(() => import("../pages/AdminTagsPage.jsx"));
const AdminUsersPage = lazy(() => import("../pages/AdminUsersPage.jsx"));
const TrashPage = lazy(() => import("../pages/TrashPage.jsx"));

const lazyFallback = (
  <div className="max-w-2xl mx-auto px-4 py-8 text-slate-400">Memuat...</div>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/folder/:id" element={<FolderPage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/trash"
        element={
          <RequireAuth>
            <Suspense fallback={lazyFallback}>
              <TrashPage />
            </Suspense>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/tags"
        element={
          <RequireAdmin>
            <Suspense fallback={lazyFallback}>
              <AdminTagsPage />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <Suspense fallback={lazyFallback}>
              <AdminUsersPage />
            </Suspense>
          </RequireAdmin>
        }
      />
    </Routes>
  );
}
