// Service worker mínimo para que HorarioEdu cumpla los criterios de
// instalabilidad de Android (necesarios para empaquetarla como TWA).
// Estrategia: red primero, sin caché agresivo — esta es una app de gestión
// que siempre necesita datos frescos de Supabase, así que evitamos servir
// contenido desactualizado desde caché.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response("Sin conexión. Verifica tu internet e intenta de nuevo.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
    )
  );
});
