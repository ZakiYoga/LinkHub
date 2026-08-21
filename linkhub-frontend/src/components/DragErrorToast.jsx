import { useEffect } from "react";
import PropTypes from "prop-types";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Small self-contained error banner — not a general toast system
// (there isn't one in the project yet), just enough to surface a
// rejected drag-drop move (cycle, forbidden, etc.) without silently
// failing. Auto-dismisses after 5s, or the person can close it early.
export default function DragErrorToast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-destructive/30 bg-background px-4 py-3 shadow-lg">
      <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
      <span className="text-sm text-foreground">{message}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

DragErrorToast.propTypes = {
  message: PropTypes.string,
  onDismiss: PropTypes.func.isRequired,
};