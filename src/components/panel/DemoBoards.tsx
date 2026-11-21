"use client";

import { PanelBoard } from "@/components/panel/PanelBoard";
import { useDemoReady } from "@/components/panel/useDemoReady";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDemoStore } from "@/features/demo/store";

function BoardSkeleton() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );
}

/** Pedidos del modo demostración: mismo tablero, sobre los datos de ejemplo. */
export function DemoOrders() {
  const isReady = useDemoReady();
  const orders = useDemoStore((s) => s.orders);
  const advanceOrder = useDemoStore((s) => s.advanceOrder);
  if (!isReady) return <BoardSkeleton />;
  return <PanelBoard initialOrders={orders} demo={{ onAdvance: advanceOrder }} />;
}
