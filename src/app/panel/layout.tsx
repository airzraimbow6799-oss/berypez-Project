import type { Metadata } from "next";

import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel Berypez" },
  robots: { index: false, follow: false },
};

/** Layout del panel: sin header ni footer del sitio público. */
export default function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-crema-200 min-h-dvh">
      {children}
      <Toaster />
    </div>
  );
}
