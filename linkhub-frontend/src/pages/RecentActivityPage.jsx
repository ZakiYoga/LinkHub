import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFolder } from "react-icons/fa";
import { useAuthStore, selectIsAuthed } from "../stores/authStore";
import { listRecentViews } from "../api/recentViewApi";
import { listLocalRecentViews } from "../lib/recentViewsLocal";
import ItemIcon from "../components/ItemIcon.jsx";

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Aktivitas Terakhir</h1>
      <p className="text-sm text-slate-500 mb-6">
        {isAuthed
          ? "Folder dan link yang baru-baru ini kamu buka, tersimpan di akunmu."
          : "Riwayat ini cuma tersimpan di browser ini — login supaya riwayatmu ikut lintas perangkat."}
      </p>

      {loading ? (
        <p className="text-slate-400">Memuat...</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-400 text-sm">Belum ada aktivitas.</p>
      ) : (
        <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
          {rows.map((row) => (
            <li key={`${row.entity_type}-${row.entity_id}`} className="flex items-center gap-3 px-4 py-3 text-sm">
              {row.entity_type === "folder" ? (
                <FaFolder className="text-amber-500 shrink-0" />
              ) : (
                <ItemIcon type="other" className="text-blue-600 shrink-0" />
              )}
              {row.entity_type === "folder" ? (
                <Link to={`/folder/${row.entity_id}`} className="hover:underline truncate">
                  {row.entity_name}
                </Link>
              ) : (
                <span className="truncate">{row.entity_name}</span>
              )}
              <span className="ml-auto text-xs text-slate-400 shrink-0">
                {new Date(row.viewed_at).toLocaleString("id-ID")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
