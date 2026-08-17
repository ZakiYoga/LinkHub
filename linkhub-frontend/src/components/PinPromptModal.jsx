import { useState } from "react";
import PropTypes from "prop-types";
import { FaLock } from "react-icons/fa";
import { verifyFolderPin } from "../api/pinApi";
import { storePinToken } from "../lib/pinStorage";
import Modal from "./Modal.jsx";

// Shown whenever a browse request 403s with pin_required. On correct
// PIN, stores the unlock token (sessionStorage, keyed by folder id)
// and calls onUnlocked() so the caller can retry loading.
export default function PinPromptModal({ open, folderId, folderName, onClose, onUnlocked }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { unlock_token } = await verifyFolderPin(folderId, pin);
      storePinToken(folderId, unlock_token);
      setPin("");
      onUnlocked();
    } catch (err) {
      setError(err.response?.data?.error || "PIN salah");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Folder Terkunci">
      <div className="flex items-center gap-2 text-slate-600 mb-4">
        <FaLock className="text-amber-500" />
        <p className="text-sm">
          Folder <strong>{folderName}</strong> dilindungi PIN. Masukkan PIN untuk melanjutkan.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="PIN (4-6 digit)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center tracking-widest text-lg"
          autoFocus
          required
        />
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
            disabled={loading || pin.length < 4}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Memeriksa..." : "Buka"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

PinPromptModal.propTypes = {
  open: PropTypes.bool.isRequired,
  folderId: PropTypes.string,
  folderName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onUnlocked: PropTypes.func.isRequired,
};
