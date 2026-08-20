import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Eye, EyeOff } from "lucide-react";
import { setFolderPin, removeFolderPin } from "../api/pinApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// Owner/admin-only: set, change, or remove a folder's PIN. Unlike
// PinPromptModal this is a deliberate form (retype-to-confirm + submit
// button, no auto-submit/animation) — the two components look similar
// but serve opposite intents: this one *creates* a PIN, so it should
// feel like filling out a form, not entering one to unlock something.
export default function PinManageModal({ open, onClose, folder, onSaved }) {
  const [pin, setPin] = useState("");
  const [retypePin, setRetypePin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPin("");
      setRetypePin("");
      setShowPin(false);
      setError("");
    }
  }, [open]);

  async function handleSetPin(e) {
    e.preventDefault();
    setError("");

    if (pin.length < 4) {
      setError("PIN minimal 4 digit");
      return;
    }
    if (pin !== retypePin) {
      setError("Ulangi PIN tidak sama dengan PIN di atas");
      return;
    }

    setSaving(true);
    
    try {
      await setFolderPin(folder.id, pin);
      setPin("");
      setRetypePin("");
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Manage PIN — {folder.name}</DialogTitle>
        </DialogHeader>

        {/* <p className="text-xs text-muted-foreground">
          Folder yang dikunci PIN tetap terlihat namanya, tapi isinya (subfolder & link) tidak
          bisa dibuka tanpa PIN yang benar. Berlaku hanya untuk folder ini, tidak otomatis
          berlaku ke subfolder di dalamnya.
        </p> */}

        <form onSubmit={handleSetPin} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Masukkan PIN 4-6 digit
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground"
              onClick={() => setShowPin((v) => !v)}
            >
              {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPin ? "Sembunyikan" : "Tampilkan"}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="">
            <Label>{folder.pin_protected ? "PIN baru" : "PIN"}</Label>

            </div>
            <InputOTP
              maxLength={6}
              value={pin}
              onChange={setPin}
              pattern={REGEXP_ONLY_DIGITS}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} mask={!showPin} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-2">
            <Label>Ulangi PIN</Label>
            <InputOTP
              maxLength={6}
              value={retypePin}
              onChange={setRetypePin}
              pattern={REGEXP_ONLY_DIGITS}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} mask={!showPin} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            {folder.pin_protected ? (
              <Button
                type="button"
                variant="link"
                className="h-auto justify-start p-0 text-destructive"
                onClick={handleRemovePin}
                disabled={saving}
              >
                Hapus PIN
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || pin.length < 4 || retypePin.length < 4}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

PinManageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  folder: PropTypes.object,
  onSaved: PropTypes.func.isRequired,
};