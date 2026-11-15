"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fieldErrors } from "@/features/checkout/schema";
import { reservationSchema } from "@/features/reservations/place-reservation";
import { stepForField, WIZARD_STEPS } from "@/features/reservations/wizard";

import type { FieldErrors, ReservationDraft } from "./types";

type Handlers = {
  /** Muestra errores y lleva al paso donde se corrigen. */
  onErrors: (errors: FieldErrors, step: number) => void;
  /** La hora se llenó mientras confirmaba (409): volver a elegir hora. */
  onSlotTaken: () => void;
  /** El antibots rechazó el token (403): pedir uno nuevo. */
  onTokenRejected: () => void;
};

const stepIndexFor = (field: string) => WIZARD_STEPS.findIndex((s) => s.id === stepForField(field));

/** Envía la reserva: valida igual que el servidor, crea y redirige a la página de gestión. */
export function useSubmitReservation(handlers: Handlers) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const reportErrors = (errors: FieldErrors) => {
    const first = Object.keys(errors)[0];
    handlers.onErrors(errors, first ? stepIndexFor(first) : WIZARD_STEPS.length - 1);
  };

  const submit = async (draft: ReservationDraft, token: string) => {
    setFormError("");
    const parsed = reservationSchema.safeParse({ ...draft, turnstileToken: token });
    if (!parsed.success) {
      reportErrors(fieldErrors(parsed.error) as FieldErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/reservas/${json.data.manageToken}`);
        return;
      }
      if (res.status === 409) {
        handlers.onSlotTaken();
        return;
      }
      if (res.status === 403) handlers.onTokenRejected();
      reportErrors((json.error.fields ?? {}) as FieldErrors);
      setFormError(json.error.message);
    } catch {
      setFormError("No hay conexión. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, formError, setFormError };
}
