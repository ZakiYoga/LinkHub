import { useEffect, useState } from "react";

export function useDebounce(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Saat value dikosongkan (mis. reset filter, hapus input),
    // langsung flush tanpa delay — supaya efek yang menunggu
    // debouncedQuery tidak sempat membaca nilai lama yang stale.
    // Delay tetap berlaku normal untuk perubahan non-kosong (mengetik).
    if (!value) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}