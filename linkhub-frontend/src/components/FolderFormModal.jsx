import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { folderFormSchema } from "../schemas/folderSchema";
import { createFolder, updateFolder } from "../api/folderApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// One modal handles both create and edit: if `folder` is passed, it's
// edit mode (pre-fills the name and PATCHes on submit); otherwise it's
// create mode under `parentId`.
export default function FolderFormModal({ open, onClose, onSaved, folder, parentId }) {
  const isEdit = Boolean(folder);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(folder?.name || "");
      setError("");
    }
  }, [open, folder]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name,
      parent_id: isEdit ? folder.parent_id ?? null : parentId || null,
    };

    const result = folderFormSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateFolder(folder.id, payload);
      } else {
        await createFolder(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan folder");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Folder" : "Buat Folder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Nama Folder</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

FolderFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  folder: PropTypes.object,
  parentId: PropTypes.string,
};