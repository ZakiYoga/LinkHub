import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import SearchHeader from "../components/SearchHeader.jsx";

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            {/* <SearchHeader /> */}
            <Outlet />
        </div>
    );
}