import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { getFolderSummary } from "../api/folderApi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  async function handleConfirm(e) {
    e.preventDefault();
    setDeleting(true);
    try {
      await onConfirm(target);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isFolder ? "Hapus Folder?" : "Hapus Link?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isFolder && loadingSummary
              ? "Menghitung isi folder..."
              : isFolder && hasContent
              ? `Folder "${target.name}" berisi ${summary.subfolder_count} subfolder dan ${summary.item_count} item. Semua akan ikut terhapus.`
              : `Yakin ingin menghapus "${target.name}"? Tindakan ini tidak bisa dibatalkan.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleting || (isFolder && loadingSummary)}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {deleting ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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