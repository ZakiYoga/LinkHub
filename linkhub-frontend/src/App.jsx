import AppRoutes from "./routes/AppRoutes.jsx";
import Navbar from "./components/Navbar.jsx";
import SearchHeader from "./components/SearchHeader.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <SearchHeader />
      <AppRoutes />
    </div>
  );
}
