// /queue is the canonical workstation URL — same page as /(workstation)/page.tsx.
// force-dynamic must be declared in this file directly; Next.js reads route
// segment config exports from the route file itself, not through re-exports.
export const dynamic = "force-dynamic";

export { default } from "../page";
