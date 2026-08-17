import { useState } from "react";
import PropTypes from "prop-types";
import { setFolderPin, removeFolderPin } from "../api/pinApi";
import Modal from "./Modal.jsx";

// Owner/admin-only: set, change, or remove a folder's PIN. Shown from
// the lock icon on FolderCard (only rendered when canEdit is true —
// same rule as edit/delete, see PermissionService.CanManagePin).
export default function PinManageModal({ open, onClose, folder, onSaved }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSetPin(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await setFolderPin(folder.id, pin);
      setPin("");
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengatur PIN");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePin() {
    setError("");
    setSaving(true);
    try {
      await removeFolderPin(folder.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menghapus PIN");
    } finally {
      setSaving(false);
    }
  }

  if (!folder) return null;

  return (
    <Modal open={open} onClose={onClose} title={`PIN — ${folder.name}`}>
      <p className="text-xs text-slate-500 mb-4">
        Folder yang dikunci PIN tetap terlihat namanya, tapi isinya (subfolder & link) tidak
        bisa dibuka tanpa PIN yang benar. Berlaku hanya untuk folder ini, tidak otomatis
        berlaku ke subfolder di dalamnya.
      </p>

      <form onSubmit={handleSetPin} className="flex gap-2 mb-3">
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder={folder.pin_protected ? "PIN baru (ganti)" : "Set PIN (4-6 digit)"}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving || pin.length < 4}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Simpan
        </button>
      </form>

      {folder.pin_protected && (
        <button
          type="button"
          onClick={handleRemovePin}
          disabled={saving}
          className="text-sm text-red-600 hover:underline mb-3"
        >
          Hapus PIN (buka kunci folder ini)
        </button>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex justify-end pt-2">
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

PinManageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  folder: PropTypes.object,
  onSaved: PropTypes.func.isRequired,
};
