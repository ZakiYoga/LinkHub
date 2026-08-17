import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { menuItemFormSchema } from "../schemas/itemSchema";
import { createItem, updateItem } from "../api/itemApi";
import Modal from "./Modal.jsx";

const TYPE_OPTIONS = [
  { value: "spreadsheet", label: "Spreadsheet" },
  { value: "slides", label: "Slides" },
  { value: "drive", label: "Drive" },
  { value: "document", label: "Document" },
  { value: "form", label: "Form" },
  { value: "other", label: "Lainnya" },
];

const emptyForm = {
  name: "",
  url: "",
  type: "spreadsheet",
  description: "",
  tag_ids: [],
};

// Same create/edit-in-one-modal pattern as FolderFormModal. `folderId`
// is only used on create (new items land in the folder currently being
// browsed); on edit we keep the item's existing folder_id untouched.
export default function ItemFormModal({ open, onClose, onSaved, item, folderId, tags }) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (item) {
      setForm({
        name: item.name,
        url: item.url,
        type: item.type,
        description: item.description || "",
        tag_ids: (item.tags || []).map((t) => t.id),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, item]);

  function toggleTag(tagId) {
    setForm((f) => ({
      ...f,
      tag_ids: f.tag_ids.includes(tagId)
        ? f.tag_ids.filter((id) => id !== tagId)
        : [...f.tag_ids, tagId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      ...form,
      folder_id: isEdit ? item.folder_id ?? null : folderId || null,
    };

    const result = menuItemFormSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateItem(item.id, payload);
      } else {
        await createItem(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan link");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Link" : "Tambah Link"}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Nama</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">URL</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="https://..."
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tipe</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Deskripsi (opsional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={2}
          />
        </div>
        {tags?.length > 0 && (
          <div>
            <label className="block text-sm text-slate-600 mb-1">Tag</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={
                    form.tag_ids.includes(tag.id)
                      ? "text-xs rounded-full px-3 py-1 bg-blue-600 text-white border border-blue-600"
                      : "text-xs rounded-full px-3 py-1 bg-white text-slate-600 border border-slate-300 hover:border-slate-400"
                  }
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
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

ItemFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  item: PropTypes.object,
  folderId: PropTypes.string,
  tags: PropTypes.array,
};
