import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Root route — redirect to the queue workstation.
// Middleware handles auth: unauthenticated users are sent to /login first.
export default function RootPage() {
  redirect("/queue");
}
