import { useEffect, useState } from "react";
import { Folder, Undo2 } from "lucide-react";
import { listDeletedFolders, listDeletedItems, restoreFolder, restoreItem } from "../api/trashApi";
import ItemIcon from "../components/ItemIcon.jsx";
import PageContainer from "../components/PageContainer.jsx";
import { Button } from "@/components/ui/button";

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
            <h1 className="mb-2 text-2xl font-bold text-foreground">Sampah</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                Folder dan link yang sudah dihapus. Bisa dipulihkan selama belum ada konflik
                (mis. folder induk masih terhapus, atau URL sudah dipakai link lain).
            </p>

            {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

            {loading ? (
                <p className="text-muted-foreground">Memuat...</p>
            ) : (
                <>
                    <section className="mb-8">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Folder ({folders.length})
                        </h2>
                        {folders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada folder terhapus.</p>
                        ) : (
                            <ul className="divide-y rounded-lg border">
                                {folders.map((f) => (
                                    <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                        <span className="flex min-w-0 items-center gap-2 truncate text-sm">
                                            <Folder className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
                                            <span className="truncate">{f.name}</span>
                                        </span>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto shrink-0 gap-1.5 p-0"
                                            onClick={() => handleRestoreFolder(f.id)}
                                        >
                                            <Undo2 className="h-3 w-3" /> Pulihkan
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Link ({items.length})
                        </h2>
                        {items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada link terhapus.</p>
                        ) : (
                            <ul className="divide-y rounded-lg border">
                                {items.map((item) => (
                                    <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                        <span className="flex min-w-0 items-center gap-2 truncate text-sm">
                                            <ItemIcon type={item.type} className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{item.name}</span>
                                        </span>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto shrink-0 gap-1.5 p-0"
                                            onClick={() => handleRestoreItem(item.id)}
                                        >
                                            <Undo2 className="h-3 w-3" /> Pulihkan
                                        </Button>
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