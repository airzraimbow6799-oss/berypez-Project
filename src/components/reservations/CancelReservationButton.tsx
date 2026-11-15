"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";

export function CancelReservationButton({ token }: { token: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const cancel = async () => {
    if (!window.confirm("¿Seguro que quieres cancelar tu reserva?")) return;
    setIsLoading(true);
    const res = await fetch(`/api/reservations/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    const json = await res.json().catch(() => null);
    setIsLoading(false);
    if (!res.ok) {
      toast.error(json?.error?.message ?? "No pudimos cancelar la reserva.");
      return;
    }
    toast.success("Reserva cancelada");
    router.refresh();
  };

  return (
    <Button variant="secundario" onClick={cancel} isLoading={isLoading}>
      Cancelar reserva
    </Button>
  );
}
