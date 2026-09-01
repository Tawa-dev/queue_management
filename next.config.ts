import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withSerwist({
  // Source file Serwist compiles into the service worker
  swSrc: "src/sw.ts",
  // Output — served by Next.js at /sw.js
  swDest: "public/sw.js",
  // Only active in production; disabled in dev to avoid stale-cache confusion.
  // Note: build script uses --webpack because @serwist/next uses a webpack
  // plugin that is incompatible with Next.js 16's default Turbopack.
  disable: process.env.NODE_ENV !== "production",
})(nextConfig);
