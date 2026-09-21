"use client";

import { useEffect } from "react";

/**
 * Registra el service worker de shell (`/sw.js`) si existe.
 * No-op silencioso si el archivo no está o el registro falla.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function register() {
      try {
        if (process.env.NODE_ENV === "development") {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((reg) => reg.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
          return;
        }
        const head = await fetch("/sw.js", {
          method: "HEAD",
          cache: "no-store",
        });
        if (!head.ok || cancelled) return;
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // No-op: PWA opcional en desarrollo / sin SW.
      }
    }

    void register();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
