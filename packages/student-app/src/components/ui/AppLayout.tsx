import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav.js";
import { SOSButton } from "./SOSButton.js";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg pb-24">
      {children}
      <SOSButton />
      <BottomNav />
    </div>
  );
}
