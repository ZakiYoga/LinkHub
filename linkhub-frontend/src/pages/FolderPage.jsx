import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, FolderPlus } from "lucide-react";
import { listFolders, getFolder, deleteFolder } from "../api/folderApi";
import { listItems, deleteItem } from "../api/itemApi";
import { listTags } from "../api/tagApi";
import { extractPinRequired } from "../api/pinApi";
import { useAuthStore, selectIsAuthed, canEditEntity } from "../stores/authStore";
import { usePagination } from "../hooks/usePagination";
import { trackView } from "../lib/trackView";
import FolderCard from "../components/FolderCard.jsx";
import ItemCard from "../components/ItemCard.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import FolderFormModal from "../components/FolderFormModal.jsx";
import ItemFormModal from "../components/ItemFormModal.jsx";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog.jsx";
import CollaboratorModal from "../components/CollaboratorModal.jsx";
import PageContainer from "../components/PageContainer.jsx";
import PinPromptModal from "../components/PinPromptModal.jsx";
import PinManageModal from "../components/PinManageModal.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import ViewModeToggle from "../components/ViewModeToggle.jsx";
import OwnerScopeSelect from "../components/OwnerScopeSelect.jsx";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrowseFilterStore } from "../stores/browseFilterStore.js";
import { useViewMode } from "../hooks/useViewMode.js";

export default function FolderPage() {
  const { id: folderId } = useParams(); // undefined at root ("/")
  const navigate = useNavigate();
  const isAuthed = useAuthStore(selectIsAuthed);
  const user = useAuthStore((s) => s.user);

  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [itemTotal, setItemTotal] = useState(0);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pinPrompt, setPinPrompt] = useState(null); // { folderName } | null

  // Bumping reloadKey re-runs the data-loading effect below. Used
  // after any create/update/delete so the list reflects the change
  // without a full page refresh.
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const [folderModal, setFolderModal] = useState({ open: false, folder: null });
  const [itemModal, setItemModal] = useState({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [collaboratorFolder, setCollaboratorFolder] = useState(null);
  const [pinManageFolder, setPinManageFolder] = useState(null);

  const { type, tagIds, sort, ownerScope, setOwnerScope, setType, toggleTag, clearTags } =
    useBrowseFilterStore();
  const { page, limit, setPage, changeLimit, reset: resetPage } = usePagination();

  const { viewMode, setViewMode, folderGridClass, itemGridClass } = useViewMode();

  useEffect(() => {
    listTags().then(setTags).catch(() => { });
  }, [reloadKey]);

  useEffect(() => {
    resetPage();
  }, [folderId, type, tagIds, sort, ownerScope, resetPage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const [folderList, breadcrumbData] = await Promise.all([
        listFolders(folderId, isAuthed ? ownerScope : undefined),
        folderId ? getFolder(folderId).then((d) => d.breadcrumb) : Promise.resolve([]),
      ]);
      const itemData = await listItems({
        folder_id: folderId,
        type: type || undefined,
        tag: tagIds.length ? tagIds.join(",") : undefined,
        sort,
        page,
        limit,
        owner_scope: isAuthed && ownerScope !== "all" ? ownerScope : undefined,
      });

      if (!cancelled) {
        setFolders(folderList);
        setBreadcrumb(breadcrumbData);
        setItems(itemData.items || []);
        setItemTotal(itemData.total || 0);
        setPinPrompt(null);
        setLoading(false);
      }
    }

    load().catch((err) => {
      if (cancelled) return;
      const pinInfo = extractPinRequired(err);
      if (pinInfo) {
        setPinPrompt(pinInfo);
        setFolders([]);
        setItems([]);
        setItemTotal(0);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [folderId, type, tagIds, sort, ownerScope, isAuthed, page, limit, reloadKey]);


  useEffect(() => {
    if (folderId && !loading && !pinPrompt) {
      const current = breadcrumb[breadcrumb.length - 1];
      if (current) trackView("folder", folderId, current.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, loading]);

  async function handleDeleteConfirm(target) {
    if (target.type === "folder") {
      await deleteFolder(target.id);
    } else {
      await deleteItem(target.id);
    }
    refresh();
  }

  return (
    <PageContainer size="md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">LinkHub</h1>
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {isAuthed && (
        <div className="flex flex-wrap flex-col sm:flex-row-reverse items-center justify-between gap-4 sm:gap-2 mb-6 ">
          <div className="flex gap-2 w-full sm:w-fit">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFolderModal({ open: true, folder: null })}
            >
              <FolderPlus /> Buat Folder
            </Button>
            <Button size="sm" onClick={() => setItemModal({ open: true, item: null })}>
              <Plus /> Tambah Link
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-fit">
            <OwnerScopeSelect value={ownerScope} onChange={setOwnerScope} className="w-42.5" />
          </div>
        </div>
      )}

      {breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <>
          {folders.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Folder
              </h2>
              <div className={folderGridClass}>
                {folders.map((f) => (
                  <FolderCard
                    key={f.id}
                    folder={f}
                    canEdit={canEditEntity(user, f)}
                    view={viewMode}
                    onEdit={(folder) => setFolderModal({ open: true, folder })}
                    onDelete={(folder) =>
                      setDeleteTarget({ type: "folder", id: folder.id, name: folder.name })
                    }
                    onManageCollaborators={(folder) => setCollaboratorFolder(folder)}
                    onManagePin={(folder) => setPinManageFolder(folder)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="flex h-auto flex-1 flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Link
            </h2>
            {items.length === 0 ? (
              <p className="text-muted-foreground">Belum ada link di folder ini.</p>
            ) : (
              <div className={itemGridClass}>
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    canEdit={canEditEntity(user, item)}
                    onOpen={() => trackView("menu_item", item.id, item.name)}
                    onEdit={(it) => setItemModal({ open: true, item: it })}
                    onDelete={(it) =>
                      setDeleteTarget({ type: "item", id: it.id, name: it.name })
                    }
                  />
                ))}
              </div>
            )}
            <PaginationControls
              page={page}
              limit={limit}
              total={itemTotal}
              onPageChange={setPage}
              onLimitChange={changeLimit}
            />
          </section>
        </>
      )}

      <FolderFormModal
        open={folderModal.open}
        folder={folderModal.folder}
        parentId={folderId}
        onClose={() => setFolderModal({ open: false, folder: null })}
        onSaved={refresh}
      />
      <ItemFormModal
        open={itemModal.open}
        item={itemModal.item}
        folderId={folderId}
        tags={tags}
        onClose={() => setItemModal({ open: false, item: null })}
        onSaved={refresh}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <CollaboratorModal
        open={Boolean(collaboratorFolder)}
        folder={collaboratorFolder}
        onClose={() => setCollaboratorFolder(null)}
      />
      <PinManageModal
        open={Boolean(pinManageFolder)}
        folder={pinManageFolder}
        onClose={() => setPinManageFolder(null)}
        onSaved={refresh}
      />
      <PinPromptModal
        open={Boolean(pinPrompt)}
        folderId={folderId}
        folderName={pinPrompt?.folderName}
        onClose={() => navigate("/")}
        onUnlocked={refresh}
      />
    </PageContainer>
  );
}