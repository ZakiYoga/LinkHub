import { useEffect, useState } from "react";
import { listTags, createTag, updateTag, deleteTag } from "../api/tagApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageContainer from "@/components/PageContainer";
import { Pencil, Trash, Trash2 } from "lucide-react";

export default function AdminTagsPage() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  function refresh() {
    listTags().then(setTags).catch(() => { });
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
    <PageContainer size="md">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Kelola Tag</h1>

      <form onSubmit={handleCreate} className="mb-2 flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama tag baru"
          required
        />
        <Button type="submit">Tambah</Button>
      </form>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <ul className="mt-4 divide-y rounded-lg border">
        {tags.map((tag) => (
          <li key={tag.id} className="flex items-center justify-between gap-3 px-4 py-3">
            {editingId === tag.id ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="h-8 flex-1 text-sm"
                autoFocus
              />
            ) : (
              <span className="truncate text-sm">{tag.name}</span>
            )}

            <div className="flex shrink-0 items-center gap-3 text-sm">
              {editingId === tag.id ? (
                <>
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={() => handleRename(tag.id)}>
                    Simpan
                  </Button>
                  <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={cancelEdit}>
                    Batal
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="h-auto rounded-sm p-1 text-muted-foreground" onClick={() => startEdit(tag)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" className="h-auto rounded-sm p-1 text-muted-foreground" onClick={() => handleDelete(tag.id)}>
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
        {tags.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">Belum ada tag.</li>
        )}
      </ul>
    </PageContainer>
  );
}