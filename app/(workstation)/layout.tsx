import React from "react";
import { WorkstationLayout } from "@/components/layout";

export default function WorkstationRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkstationLayout>{children}</WorkstationLayout>;
}
