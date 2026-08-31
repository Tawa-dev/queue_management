import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

// __SW_MANIFEST is injected at build time by the Serwist webpack plugin.
// It contains the versioned list of all static assets to precache.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: Window & typeof globalThis & { __SW_MANIFEST: any[] };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
