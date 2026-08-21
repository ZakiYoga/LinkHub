import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// registerType: "autoUpdate" (vite.config.js) means the new service
// worker + assets are already downloaded and waiting — this toast just
// tells the person a reload will pick them up, since the running page
// still has the OLD JS in memory until they reload. Also doubles as an
// "offline ready" notice the first time the app finishes precaching,
// so people know the app now works without a connection.
export default function PWAUpdateToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for a new service worker every hour while the tab stays
      // open — otherwise updates are only ever noticed on a fresh
      // page load, which for a tab people leave open all day could be
      // a long time.
      if (!registration) return;
      setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
      {needRefresh ? (
        <>
          <RefreshCw className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm text-foreground">Versi baru SakiHub tersedia.</span>
          <Button size="sm" onClick={() => updateServiceWorker(true)}>
            Muat ulang
          </Button>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">SaktiHub siap dipakai offline.</span>
        </>
      )}
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={close}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}