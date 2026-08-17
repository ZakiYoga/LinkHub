import { useEffect } from "react";

export function useClickOutside(ref, handler) {
    useEffect(() => {
        function onPointerDown(e) {
            if (!ref.current || ref.current.contains(e.target)) return;
            handler(e);
        }
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [ref, handler]);
}