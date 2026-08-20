import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { motion, useAnimation } from "framer-motion";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Lock, TriangleAlert } from "lucide-react";
import { verifyFolderPin } from "../api/pinApi";
import { storePinToken } from "../lib/pinStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export default function PinPromptModal({ open, folderId, folderName, onClose, onUnlocked }) {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | error | success | locked
  const [lockMessage, setLockMessage] = useState("");
  const shakeControls = useAnimation();
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setStatus("idle");
      setLockMessage("");
    }
  }, [open]);

  // Re-focus the (hidden) native input whenever we land back on "idle"
  // — after a wrong PIN it's disabled during the check/shake, and
  // re-enabling it doesn't automatically restore focus. Deliberately
  // does NOT run for "locked": that state stays disabled on purpose.
  useEffect(() => {
    if (open && status === "idle") {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [open, status]);

  async function handleComplete(value) {
    setStatus("checking");
    try {
      const { unlock_token } = await verifyFolderPin(folderId, value);
      storePinToken(folderId, unlock_token);
      setStatus("success");
      // Kasih jeda sebentar biar border hijau sempat kelihatan sebelum
      // modal ditutup oleh parent (via onUnlocked -> refresh -> pinPrompt null).
      setTimeout(() => onUnlocked(), 400);
    } catch (err) {
      if (err.response?.status === 429) {
        // Rate-limited — stop here. Tidak auto-clear, tidak balik ke
        // idle, supaya tidak nembak verify-pin lagi selama lockout
        // backend masih aktif (itu penyebab spam 429 sebelumnya).
        setStatus("locked");
        setLockMessage(
          err.response?.data?.error || "Terlalu banyak percobaan salah. Coba lagi nanti."
        );
        return;
      }

      setStatus("error");
      shakeControls.start({
        x: [0, -10, 10, -8, 8, -4, 4, 0],
        transition: { duration: 0.4, ease: "easeInOut" },
      });
      setTimeout(() => {
        setPin("");
        setStatus("idle");
      }, 550);
    }
  }

  function handleClose() {
    setPin("");
    setStatus("idle");
    setLockMessage("");
    onClose();
  }

  const isLocked = status === "locked";
  const slotClass = cn(
    "transition-colors duration-200",
    status === "error" && "border-destructive ring-1 ring-destructive",
    status === "success" && "border-emerald-500 ring-1 ring-emerald-500",
    isLocked && "border-amber-500 ring-1 ring-amber-500"
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Folder Terkunci</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm">
            Folder <strong className="text-foreground">{folderName}</strong> dilindungi PIN.
            Masukkan 6 digit PIN untuk melanjutkan.
          </p>
        </div>

        <motion.div animate={shakeControls} className="flex justify-center py-2">
          <InputOTP
            ref={inputRef}
            maxLength={6}
            value={pin}
            onChange={setPin}
            onComplete={handleComplete}
            pattern={REGEXP_ONLY_DIGITS}
            disabled={status === "checking" || status === "success" || isLocked}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} mask className={slotClass} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </motion.div>

        {isLocked ? (
          <p className="flex items-start gap-1.5 text-xs text-amber-600">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {lockMessage}
          </p>
        ) : (
          <p
            className={cn(
              "h-4 text-center text-xs transition-opacity",
              status === "error" ? "text-destructive opacity-100" : "opacity-0"
            )}
          >
            PIN salah, coba lagi.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

PinPromptModal.propTypes = {
  open: PropTypes.bool.isRequired,
  folderId: PropTypes.string,
  folderName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onUnlocked: PropTypes.func.isRequired,
};