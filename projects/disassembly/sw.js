// Service worker for Disassembly.
//
// Goals:
//   1. Make the site installable as a PWA (also nudges Chrome to grant
//      navigator.storage.persist for the streak/calendar history).
//   2. Cache the heavy v86 + kernel + snapshot blobs aggressively so cold
//      reloads don't redownload ~20 MB.
//   3. Keep the index.html / app.js / styles.css / puzzles.bin requests
//      using normal HTTP semantics so the daily puzzle and code updates
//      land promptly when a new build ships.
//
// `2026-04-18T00-39-22-561Z` is replaced at build time (scripts/build.mjs) with
// the build's timestamp so the cache name rolls forward on every deploy.

const VERSION = "2026-04-18T00-39-22-561Z";
const VM_CACHE = `disassembly-vm-${VERSION}`;
const SHELL_CACHE = `disassembly-shell-${VERSION}`;

// Files that are safe to precache (small, change with every build).
const SHELL_URLS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./favicon.svg",
  "./icon.svg",
  "./manifest.webmanifest",
];

// Big binary VM artifacts. Cached on first use, served cache-first thereafter.
function isVMBlob(url) {
  return /\/vm\/[^?#]+$/.test(url);
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Best-effort precache; ignore individual failures so a missing optional
    // asset doesn't block install.
    await Promise.all(SHELL_URLS.map(async (u) => {
      try { await cache.add(new Request(u, { cache: "reload" })); } catch {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([VM_CACHE, SHELL_CACHE]);
    for (const name of await caches.keys()) {
      if (!keep.has(name) && name.startsWith("disassembly-")) {
        await caches.delete(name);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isVMBlob(url.pathname)) {
    // Cache-first for immutable VM blobs.
    event.respondWith((async () => {
      const cache = await caches.open(VM_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const resp = await fetch(req);
      if (resp.ok) cache.put(req, resp.clone());
      return resp;
    })());
    return;
  }

  // Network-first for the app shell so updates land quickly; fall back to
  // cache when offline. puzzles.bin is small enough to refetch.
  event.respondWith((async () => {
    try {
      const resp = await fetch(req);
      if (resp.ok && (req.destination === "document" ||
                      req.destination === "script" ||
                      req.destination === "style")) {
        const cache = await caches.open(SHELL_CACHE);
        cache.put(req, resp.clone());
      }
      return resp;
    } catch (e) {
      const cache = await caches.open(SHELL_CACHE);
      const hit = await cache.match(req) || await cache.match("./index.html");
      if (hit) return hit;
      throw e;
    }
  })());
});
