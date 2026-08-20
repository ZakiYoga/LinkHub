import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Folder } from "lucide-react";
import { useAuthStore, selectIsAuthed } from "../stores/authStore";
import { listRecentViews } from "../api/recentViewApi";
import { listLocalRecentViews } from "../lib/recentViewsLocal";
import ItemIcon from "../components/ItemIcon.jsx";
import PageContainer from "@/components/PageContainer";

// Source depends on auth state: logged-in users get their
// server-persisted history (cross-device); guests get whatever's in
// this browser's localStorage only. Neither is merged with the other.
export default function RecentActivityPage() {
  const isAuthed = useAuthStore(selectIsAuthed);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthed) {
      listRecentViews()
        .then(setRows)
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    } else {
      setRows(listLocalRecentViews());
      setLoading(false);
    }
  }, [isAuthed]);

  return (
    <PageContainer size="md">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Aktivitas Terakhir</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isAuthed
          ? "Folder dan link yang baru-baru ini kamu buka, tersimpan di akunmu."
          : "Riwayat ini cuma tersimpan di browser ini — login supaya riwayatmu ikut lintas perangkat."}
      </p>

      {loading ? (
        <p className="text-muted-foreground">Memuat...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((row) => (
            <li key={`${row.entity_type}-${row.entity_id}`} className="flex items-center gap-3 px-4 py-3 text-sm">
              {row.entity_type === "folder" ? (
                <Folder className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
              ) : (
                <ItemIcon type="other" className="h-4 w-4 shrink-0" />
              )}
              {row.entity_type === "folder" ? (
                <Link to={`/folder/${row.entity_id}`} className="truncate hover:underline">
                  {row.entity_name}
                </Link>
              ) : (
                <span className="truncate">{row.entity_name}</span>
              )}
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {new Date(row.viewed_at).toLocaleString("id-ID")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}