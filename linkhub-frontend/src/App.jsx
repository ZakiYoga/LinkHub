import AppRoutes from "./routes/AppRoutes.jsx";
import PWAUpdateToast from "./components/PWAUpdateToast.jsx";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <AppRoutes />
      <PWAUpdateToast />
      {/* bottom-right, not bottom-center — PWAUpdateToast already owns
          bottom-center and the two would otherwise stack/overlap. */}
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}