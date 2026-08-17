import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlus, FaFolderPlus } from "react-icons/fa";
import { GoChevronDown } from "react-icons/go";
import { listFolders, getFolder, deleteFolder } from "../api/folderApi";
import { listItems, deleteItem } from "../api/itemApi";
import { listTags } from "../api/tagApi";
import { extractPinRequired } from "../api/pinApi";
import { useAuthStore, selectIsAuthed, canEditEntity } from "../stores/authStore";
import { useDebounce } from "../hooks/useDebounce";
import { usePagination } from "../hooks/usePagination";
import { trackView } from "../lib/trackView";
import { useLocalStorage } from "../hooks/useLocalStorage";
import FolderCard from "../components/FolderCard.jsx";
import ItemCard from "../components/ItemCard.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import SearchBar from "../components/SearchBar.jsx";
import TagFilterDropdown from "../components/TagFilterDropdown.jsx";
import ViewModeToggle from "../components/ViewModeToggle.jsx";
import FolderFormModal from "../components/FolderFormModal.jsx";
import ItemFormModal from "../components/ItemFormModal.jsx";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog.jsx";
import CollaboratorModal from "../components/CollaboratorModal.jsx";
import PageContainer from "../components/PageContainer.jsx";
import PinPromptModal from "../components/PinPromptModal.jsx";
import PinManageModal from "../components/PinManageModal.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
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

  const { type, tagIds, sort, setType, toggleTag, clearTags } = useBrowseFilterStore();
  const { page, limit, setPage, changeLimit, reset: resetPage } = usePagination();

  const { viewMode, setViewMode, folderGridClass, itemGridClass } = useViewMode();

  function handleClearTags() {
    clearTags();
  }

  useEffect(() => {
    listTags().then(setTags).catch(() => { });
  }, [reloadKey]);

  useEffect(() => {
    resetPage();
  }, [folderId, type, tagIds, sort, resetPage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const [folderList, breadcrumbData] = await Promise.all([
        listFolders(folderId),
        folderId ? getFolder(folderId).then((d) => d.breadcrumb) : Promise.resolve([]),
      ]);
      const itemData = await listItems({
        folder_id: folderId,
        type: type || undefined,
        tag: tagIds.length ? tagIds.join(",") : undefined,
        sort,
        page,
        limit,
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
  }, [folderId, type, tagIds, sort, page, limit, reloadKey]);


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
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">LinkHub</h1>

        {isAuthed && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFolderModal({ open: true, folder: null })}
              className="flex items-center gap-1.5 text-sm rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              <FaFolderPlus /> Buat Folder
            </button>
            <button
              type="button"
              onClick={() => setItemModal({ open: true, item: null })}
              className="flex items-center gap-1.5 text-sm rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
            >
              <FaPlus /> Tambah Link
            </button>
          </div>
        )}

        <ViewModeToggle value={viewMode} onChange={setViewMode} />

      </div>

      {breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}

      {loading ? (
        <p className="text-slate-400">Memuat...</p>
      ) : (
        <>
          {folders.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">
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
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Link
            </h2>
            {items.length === 0 ? (
              <p className="text-slate-400">Belum ada link di folder ini.</p>
            ) : (
              <div className={`${itemGridClass}`}>
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