import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { getFolderSummary } from "../api/folderApi";
import Modal from "./Modal.jsx";

// One dialog for both folder and item deletion. For folders it first
// calls GET /folders/{id}/summary to count nested subfolders/items
// (design doc section 16.6) and adapts the message: neutral if empty,
// a warning if something's inside. Items don't nest, so they always
// get the plain confirm text. Either way there's a single confirm
// button — no separate "are you sure you're sure" step.
export default function DeleteConfirmDialog({ open, onClose, onConfirm, target }) {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && target?.type === "folder") {
      setLoadingSummary(true);
      getFolderSummary(target.id)
        .then(setSummary)
        .catch(() => setSummary(null))
        .finally(() => setLoadingSummary(false));
    } else {
      setSummary(null);
    }
  }, [open, target]);

  if (!target) return null;

  const isFolder = target.type === "folder";
  const hasContent = summary && (summary.subfolder_count > 0 || summary.item_count > 0);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm(target);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isFolder ? "Hapus Folder?" : "Hapus Link?"}>
      {isFolder && loadingSummary ? (
        <p className="text-sm text-slate-500">Menghitung isi folder...</p>
      ) : (
        <p className="text-sm text-slate-600">
          {isFolder && hasContent
            ? `Folder "${target.name}" berisi ${summary.subfolder_count} subfolder dan ${summary.item_count} item. Semua akan ikut terhapus.`
            : `Yakin ingin menghapus "${target.name}"? Tindakan ini tidak bisa dibatalkan.`}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={deleting || (isFolder && loadingSummary)}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Menghapus..." : "Hapus"}
        </button>
      </div>
    </Modal>
  );
}

DeleteConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  target: PropTypes.shape({
    type: PropTypes.oneOf(["folder", "item"]).isRequired,
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
};
