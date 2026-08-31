# Spec 0009 — PWA Offline Caching

## Status
Ready for implementation

## Context

`@serwist/next` and `serwist` are already installed (`^9.5.12`) but zero PWA
infrastructure exists: no service worker, no manifest, no icons, no
`withSerwist` wrapper in `next.config.ts`.

The clinic has unreliable internet (AGENTS.md §1 constraint). The **display
board** (`/display/[zone]`) is the most critical offline target — it runs on a
TV in the waiting room and must survive brief network drops without going blank.
The **staff workstation** (`/queue`) is a secondary target; reads should be
readable offline but writes (check-in, assign) naturally require connectivity.

---

## Goals

1. Register a Serwist service worker that is built by `next build` and served
   at `/sw.js`.
2. Cache the application shell (JS/CSS/fonts) so pages load instantly after the
   first visit.
3. Cache the **last successful response** from `getDisplayDataAction` in
   `localStorage` so the display board can render stale data after a reload
   while offline.
4. Show a visible offline indicator on both the display board and the workstation
   when the browser detects no network.
5. Produce a valid Web App Manifest so the app is installable on desktop/tablet.

## Non-Goals

- Background sync for check-in or room assignment mutations — writes require
  connectivity and will fail gracefully with existing error handling.
- Runtime API route caching via the service worker — the Supabase DB is remote
  and caching dynamic POST responses is fragile. The display board uses
  `localStorage` persistence instead (simpler, works with server actions).
- Precaching every page — only the app shell and static assets. Page HTML is
  stale-while-revalidate at most.
- Push notifications — explicitly out of scope (AGENTS.md §1).

---

## Files to Create / Modify

### 1. `next.config.ts` — wrap with `withSerwist`

```ts
import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  // existing options
};

export default withSerwist({
  swSrc: "src/sw.ts",        // our service worker source
  swDest: "public/sw.js",    // output path served by Next.js
  // Disable in development to avoid stale cache confusion
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
```

### 2. `src/sw.ts` — service worker source

Serwist handles precaching of the Next.js app shell automatically via its
`defaultCache` recipes. We add a `StaleWhileRevalidate` strategy for
navigation requests (HTML pages) so they load from cache while revalidating.

```ts
import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "serwist";

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});
```

`self.__SW_MANIFEST` is injected by the Serwist build plugin — it contains
the versioned list of all static assets to precache.

### 3. `public/manifest.webmanifest` — Web App Manifest

```json
{
  "name": "Mabvuku Polyclinic Queue",
  "short_name": "Mabvuku Queue",
  "description": "City of Harare outpatient queue management workstation",
  "start_url": "/queue",
  "display": "standalone",
  "background_color": "#0B2D6B",
  "theme_color": "#0B2D6B",
  "orientation": "landscape",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 4. `public/icons/` — PWA icons

Generate two PNG icons from the existing `public/images/harare-crest.svg`:
- `public/icons/icon-192.png` — 192×192
- `public/icons/icon-512.png` — 512×512

Use a navy (`#0B2D6B`) background with the crest centred (matching the app
header). These can be generated with a one-off Node script at build time or
committed as static assets.

### 5. `app/layout.tsx` — manifest + theme metadata

Add to the `metadata` export:

```ts
export const metadata: Metadata = {
  title: "Mabvuku Polyclinic - Outpatient Queue Management",
  description: "...",
  manifest: "/manifest.webmanifest",
  themeColor: "#0B2D6B",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mabvuku Queue",
  },
};
```

Also add a `<link rel="apple-touch-icon">` via the `icons` metadata field.

### 6. `app/(display)/display/[zone]/page.tsx` — localStorage persistence

The display board must survive a full page reload while offline.

**Cache key:** `display_cache_<zoneCode>` in `localStorage`.

**Write:** after every successful poll, serialise the `DisplayData` result and
write it to `localStorage`.

**Read:** on mount, before the first poll returns, read from `localStorage`
and seed `data` state with the cached value. This means the board renders
immediately on reload even with no network.

```ts
// On successful poll — add inside poll() after setData(result):
try {
  localStorage.setItem(
    `display_cache_${zoneCode}`,
    JSON.stringify({ data: result, cachedAt: Date.now() })
  );
} catch {
  // localStorage quota exceeded — swallow silently
}

// On mount — seed from cache before first poll:
useEffect(() => {
  try {
    const raw = localStorage.getItem(`display_cache_${zoneCode}`);
    if (raw) {
      const { data: cached } = JSON.parse(raw) as {
        data: DisplayData;
        cachedAt: number;
      };
      setData(cached);
    }
  } catch {
    // corrupt cache — ignore
  }
}, [zoneCode]);
```

### 7. `src/components/layout/DisplayLayout.tsx` — offline banner

Add a network status indicator to the display board footer. When offline,
replace the footer message with an amber "Offline — showing last known queue"
banner so staff know the board may be stale.

```tsx
// In DisplayLayout, add alongside the existing clock useEffect:
const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const handleOnline  = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  window.addEventListener("online",  handleOnline);
  window.addEventListener("offline", handleOffline);
  setIsOnline(navigator.onLine);
  return () => {
    window.removeEventListener("online",  handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []);
```

Footer swap:

```tsx
<footer className={`px-8 py-4 flex items-center justify-center gap-3 ...
  ${isOnline ? "bg-[#0B2D6B]" : "bg-amber-600"}`}>
  {isOnline
    ? <span>{footerMessage}</span>
    : <span>⚠ Offline — showing last known queue state</span>
  }
</footer>
```

### 8. `src/components/layout/HeaderBar.tsx` — offline indicator

`HeaderBar` already renders "System Online / Offline (Cached)". Wire the
`isOnline` prop to the real browser network status using the same
`navigator.onLine` + event listener pattern so it reflects reality rather than
a hardcoded `true`.

The `isOnline` prop currently defaults to `true` and is never passed
dynamically. Move the detection inside the component:

```tsx
const [networkOnline, setNetworkOnline] = useState(true);

useEffect(() => {
  const up   = () => setNetworkOnline(true);
  const down = () => setNetworkOnline(false);
  window.addEventListener("online",  up);
  window.addEventListener("offline", down);
  setNetworkOnline(navigator.onLine);
  return () => {
    window.removeEventListener("online",  up);
    window.removeEventListener("offline", down);
  };
}, []);
```

Replace `isOnline` prop usage in the JSX with `networkOnline`.

---

## TypeScript note for `src/sw.ts`

`self.__SW_MANIFEST` is injected by the Serwist webpack plugin but TypeScript
doesn't know about it. Add to `tsconfig.json` `compilerOptions`:

```json
"types": ["serwist"]
```

Or add a one-line ambient declaration in `src/sw.ts`:

```ts
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};
```

---

## Acceptance Criteria

- [ ] `npm run build` completes without error and `public/sw.js` is generated.
- [ ] Visiting `/queue` in a browser shows the app as installable (browser
      install prompt or address-bar install icon).
- [ ] Display board renders the last-known queue state immediately on page
      reload when DevTools → Network is set to Offline.
- [ ] Display board footer turns amber and shows "Offline" when network is
      disabled.
- [ ] `HeaderBar` shows "Offline (Cached)" correctly when network is disabled.
- [ ] Polling continues (and silently fails) when offline; board does not crash
      or show an error page.
- [ ] On network restore, the next poll succeeds and updates the board.
- [ ] No console errors related to the service worker in production build.
