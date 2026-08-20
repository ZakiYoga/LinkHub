import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Trash2 } from "lucide-react";
import { listCollaborators, addCollaborator, removeCollaborator } from "../api/collaboratorApi";
import { listUsers } from "../api/userApi";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Lets a folder owner (or admin) add/remove collaborators. Access on
// this folder — inherited automatically down the whole subtree per
// the backend's ancestor-walk (design doc section 5), no per-subfolder
// re-assignment needed.
export default function CollaboratorModal({ open, onClose, folder }) {
  const [collaborators, setCollaborators] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function refresh() {
    if (!folder) return;
    setLoading(true);
    Promise.all([listCollaborators(folder.id), listUsers()])
      .then(([collabs, users]) => {
        setCollaborators(collabs || []);
        setAllUsers(users || []);
      })
      .catch(() => setError("Gagal memuat data"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (open) {
      setError("");
      setSelectedUserId("");
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, folder]);

  const collaboratorIds = new Set(collaborators.map((c) => c.user_id));
  const availableUsers = allUsers.filter(
    (u) => !collaboratorIds.has(u.id) && u.id !== folder?.created_by
  );

  async function handleAdd() {
    if (!selectedUserId) return;
    setError("");
    try {
      await addCollaborator(folder.id, selectedUserId);
      setSelectedUserId("");
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menambah kolaborator");
    }
  }

  async function handleRemove(userId) {
    setError("");
    try {
      await removeCollaborator(folder.id, userId);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menghapus kolaborator");
    }
  }

  if (!folder) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kolaborator — {folder.name}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Kolaborator otomatis punya akses ke seluruh subfolder di dalam folder ini.
        </p>

        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Pilih user..." />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.username} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" disabled={!selectedUserId} onClick={handleAdd}>
            Tambah
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : collaborators.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kolaborator.</p>
        ) : (
          <ul className="max-h-60 divide-y overflow-y-auto rounded-lg border">
            {collaborators.map((c) => {
              const user = allUsers.find((u) => u.id === c.user_id);
              return (
                <li key={c.user_id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{user ? `${user.username} (${user.role})` : c.user_id}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(c.user_id)}
                    title="Hapus kolaborator"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

CollaboratorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  folder: PropTypes.object,
};