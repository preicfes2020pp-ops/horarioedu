"use client";

import { useEffect } from "react";

export function RegistroServiceWorker() {
  useEffect(() => {
    // Los service workers interfieren con la recarga en caliente de
    // "npm run dev" (peticiones interceptadas que fallan durante cada
    // recompilación). Solo se registran en producción, que es además el
    // único contexto donde realmente hace falta (instalabilidad para TWA).
    if (process.env.NODE_ENV !== "production") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("No se pudo registrar el service worker:", err);
      });
    }
  }, []);

  return null;
}
