import { useEffect, useState } from "react";
import { listTags, createTag, updateTag, deleteTag } from "../api/tagApi";

export default function AdminTagsPage() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  function refresh() {
    listTags().then(setTags).catch(() => {});
  }

  useEffect(refresh, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await createTag(name);
      setName("");
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal membuat tag");
    }
  }

  async function handleDelete(id) {
    await deleteTag(id);
    refresh();
  }

  function startEdit(tag) {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleRename(id) {
    setError("");
    try {
      await updateTag(id, editingName);
      cancelEdit();
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal rename tag");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Kelola Tag</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama tag baru"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
        >
          Tambah
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
        {tags.map((tag) => (
          <li key={tag.id} className="flex items-center justify-between gap-3 px-4 py-3">
            {editingId === tag.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                autoFocus
              />
            ) : (
              <span className="truncate">{tag.name}</span>
            )}

            <div className="flex items-center gap-3 shrink-0 text-sm">
              {editingId === tag.id ? (
                <>
                  <button onClick={() => handleRename(tag.id)} className="text-blue-600 hover:underline">
                    Simpan
                  </button>
                  <button onClick={cancelEdit} className="text-slate-500 hover:underline">
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(tag)} className="text-slate-600 hover:underline">
                    Rename
                  </button>
                  <button onClick={() => handleDelete(tag.id)} className="text-red-600 hover:underline">
                    Hapus
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
        {tags.length === 0 && (
          <li className="px-4 py-6 text-center text-slate-400 text-sm">Belum ada tag.</li>
        )}
      </ul>
    </div>
  );
}
