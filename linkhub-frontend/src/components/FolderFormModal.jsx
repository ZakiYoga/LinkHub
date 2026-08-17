import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { folderFormSchema } from "../schemas/folderSchema";
import { createFolder, updateFolder } from "../api/folderApi";
import Modal from "./Modal.jsx";

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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Folder" : "Buat Folder"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Nama Folder</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            autoFocus
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

FolderFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  folder: PropTypes.object,
  parentId: PropTypes.string,
};
