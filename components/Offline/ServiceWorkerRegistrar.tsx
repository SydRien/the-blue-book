"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker (public/sw.js) in production builds,
 * then hands it every same-origin file this page already loaded so the app
 * can open offline from the very next launch.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let cancelled = false;

    async function register() {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) {
          return;
        }

        // Warm the PDF export libraries so export also works offline.
        await Promise.allSettled([
          import("pdfmake/build/pdfmake"),
          import("pdfmake/build/vfs_fonts"),
        ]);

        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => name.startsWith(window.location.origin));
        urls.push(window.location.origin + "/");

        registration.active?.postMessage({ type: "CACHE_URLS", urls });
      } catch {
        // Offline support is a bonus; never break the app over it.
      }
    }

    const start = () => void register();
    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
    };
  }, []);

  return null;
}
