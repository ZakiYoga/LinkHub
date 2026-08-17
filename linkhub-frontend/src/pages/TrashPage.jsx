import { useEffect, useState } from "react";
import { FaFolder, FaUndo } from "react-icons/fa";
import { listDeletedFolders, listDeletedItems, restoreFolder, restoreItem } from "../api/trashApi";
import ItemIcon from "../components/ItemIcon.jsx";
import PageContainer from "../components/PageContainer.jsx";

// Admins see every soft-deleted folder/item; everyone else only sees
// their own (backend scopes this via ListDeleted — see FolderService/
// ItemService). Not part of the original design doc — a practical
// addition so soft delete is actually usable without direct DB access.
export default function TrashPage() {
    const [folders, setFolders] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    function refresh() {
        setLoading(true);
        Promise.all([listDeletedFolders(), listDeletedItems()])
            .then(([f, i]) => {
                setFolders(f || []);
                setItems(i || []);
            })
            .catch(() => setError("Gagal memuat sampah"))
            .finally(() => setLoading(false));
    }

    useEffect(refresh, []);

    async function handleRestoreFolder(id) {
        setError("");
        try {
            await restoreFolder(id);
            refresh();
        } catch (err) {
            setError(err.response?.data?.error || "Gagal memulihkan folder");
        }
    }

    async function handleRestoreItem(id) {
        setError("");
        try {
            await restoreItem(id);
            refresh();
        } catch (err) {
            setError(err.response?.data?.error || "Gagal memulihkan item");
        }
    }

    return (
        <PageContainer size="md">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Sampah</h1>
            <p className="text-sm text-slate-500 mb-6">
                Folder dan link yang sudah dihapus. Bisa dipulihkan selama belum ada konflik
                (mis. folder induk masih terhapus, atau URL sudah dipakai link lain).
            </p>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            {loading ? (
                <p className="text-slate-400">Memuat...</p>
            ) : (
                <>
                    <section className="mb-8">
                        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                            Folder ({folders.length})
                        </h2>
                        {folders.length === 0 ? (
                            <p className="text-slate-400 text-sm">Tidak ada folder terhapus.</p>
                        ) : (
                            <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                                {folders.map((f) => (
                                    <li
                                        key={f.id}
                                        className="flex items-center justify-between gap-3 px-4 py-3"
                                    >
                                        <span className="flex items-center gap-2 text-sm min-w-0 truncate">
                                            <FaFolder className="text-amber-500 shrink-0" size={16} />
                                            <span className="truncate">{f.name}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRestoreFolder(f.id)}
                                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline shrink-0"
                                        >
                                            <FaUndo size={12} /> Pulihkan
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                            Link ({items.length})
                        </h2>
                        {items.length === 0 ? (
                            <p className="text-slate-400 text-sm">Tidak ada link terhapus.</p>
                        ) : (
                            <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                                {items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 px-4 py-3"
                                    >
                                        <span className="flex items-center gap-2 text-sm min-w-0 truncate">
                                            <ItemIcon type={item.type} className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{item.name}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRestoreItem(item.id)}
                                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline shrink-0"
                                        >
                                            <FaUndo size={12} /> Pulihkan
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </PageContainer>
    );
}