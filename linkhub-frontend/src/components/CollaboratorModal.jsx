import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaTrash } from "react-icons/fa";
import { listCollaborators, addCollaborator, removeCollaborator } from "../api/collaboratorApi";
import { listUsers } from "../api/userApi";
import Modal from "./Modal.jsx";
import { GoChevronDown } from "react-icons/go";

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

  async function handleAdd(e) {
    e.preventDefault();
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
    <Modal open={open} onClose={onClose} title={`Kolaborator — ${folder.name}`}>
      <p className="text-xs text-slate-500 mb-4">
        Kolaborator otomatis punya akses ke seluruh subfolder di dalam folder ini.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Pilih user...</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>

          <GoChevronDown
            size={16}
            className="pointer-events-none absolute pt-0.5 right-3 top-1/2 text-gray-500 font-thin -translate-y-1/2"
          />
        </div>
        <button
          type="submit"
          disabled={!selectedUserId}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Tambah
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : collaborators.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada kolaborator.</p>
      ) : (
        <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
          {collaborators.map((c) => {
            const user = allUsers.find((u) => u.id === c.user_id);
            return (
              <li key={c.user_id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{user ? `${user.username} (${user.role})` : c.user_id}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(c.user_id)}
                  className="text-slate-400 hover:text-red-600"
                  title="Hapus kolaborator"
                >
                  <FaTrash size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          Tutup
        </button>
      </div>
    </Modal>
  );
}

CollaboratorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  folder: PropTypes.object,
};
