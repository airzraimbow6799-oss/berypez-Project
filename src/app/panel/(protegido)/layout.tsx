import { DemoBar } from "@/components/panel/DemoBar";
import { getStaffSession } from "@/features/staff/session";

/** Layout de las páginas protegidas del panel: en modo demostración suma la franja de aviso. */
export default async function ProtectedPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getStaffSession();
  return (
    <>
      {session?.isDemo ? <DemoBar /> : null}
      {children}
    </>
  );
}
