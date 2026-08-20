import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import FolderPage from "../pages/FolderPage.jsx";
import SearchResultsPage from "../pages/SearchResultsPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RequireAdmin from "../components/RequireAdmin.jsx";
import RequireAuth from "../components/RequireAuth.jsx";
import RedirectIfAuthed from "../components/RedirectIfAuthed.jsx";

const AdminTagsPage = lazy(() => import("../pages/AdminTagsPage.jsx"));
const AdminUsersPage = lazy(() => import("../pages/AdminUsersPage.jsx"));
const TrashPage = lazy(() => import("../pages/TrashPage.jsx"));
// Not admin-only (guests use it too via localStorage), but still a
// secondary page — code-split like the others so the landing/folder
// bundle guests hit first stays lean.
const RecentActivityPage = lazy(() => import("../pages/RecentActivityPage.jsx"));

const lazyFallback = (
  <div className="max-w-2xl mx-auto px-4 py-8 text-slate-400">Memuat...</div>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/folder/:id" element={<FolderPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route
          path="/recent-activity"
          element={
            <Suspense fallback={lazyFallback}>
              <RecentActivityPage />
            </Suspense>
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
      </Route>
    </Routes>
  );
}