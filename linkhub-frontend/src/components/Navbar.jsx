import { Link, useNavigate } from "react-router-dom";
import { User, Trash2, Tags, Users, LogOut, History } from "lucide-react";
import { useAuthStore, selectIsAuthed, selectIsAdmin } from "../stores/authStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Navbar sengaja dibuat "bersih": satu-satunya elemen interaktif di
// kanan (selain Login untuk guest) adalah avatar user. Semua menu
// (Sampah, Kelola Tag, Kelola User, Logout) dipindah ke dropdown,
// jadi navbar tidak melebar walau menu admin bertambah nanti.
export default function Navbar() {
  const isAuthed = useAuthStore(selectIsAuthed);
  const isAdmin = useAuthStore(selectIsAdmin);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const initial = user?.id ? user.id.slice(0, 2).toUpperCase() : "?";

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-bold text-foreground">
          SaktiHub
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild title="Aktivitas Terakhir" className="rounded-full">
            <Link to="/recent-activity" className="p-1">
              <History className="h-4 w-4 text-slate-800" />
            </Link>
          </Button>

          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-slate-200 hover:bg-slate-300">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-transparent">
                      <User className="h-4 w-4 text-slate-800" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center justify-between font-normal text-muted-foreground">
                  Masuk sebagai
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground">
                    {user?.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/trash" className="cursor-pointer">
                    <Trash2 /> Sampah
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/tags" className="cursor-pointer">
                        <Tags /> Kelola Tag
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users" className="cursor-pointer">
                        <Users /> Kelola User
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}