import { Suspense } from "react";
import MapShell from "@/components/map/MapShell";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ width: "100vw", height: "100vh", backgroundColor: "#0f172a" }} />}>
      <MapShell />
    </Suspense>
  );
}
