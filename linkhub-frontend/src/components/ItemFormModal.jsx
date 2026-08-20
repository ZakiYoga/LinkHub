import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { menuItemFormSchema } from "../schemas/itemSchema";
import { createItem, updateItem } from "../api/itemApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Link" : "Tambah Link"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Nama</Label>
            <Input
              id="item-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-url">URL</Label>
            <Input
              id="item-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipe</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-desc">Deskripsi (opsional)</Label>
            <textarea
              id="item-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {tags?.length > 0 && (
            <div className="space-y-1.5">
              <Label>Tag</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = form.tag_ids.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={active ? "default" : "outline"}
                      onClick={() => toggleTag(tag.id)}
                      className={cn("cursor-pointer select-none", !active && "text-muted-foreground")}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
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

ItemFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  item: PropTypes.object,
  folderId: PropTypes.string,
  tags: PropTypes.array,
};