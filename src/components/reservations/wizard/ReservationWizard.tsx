"use client";

import { ArrowLeft, ArrowRight, Check, Undo2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { BRANCHES } from "@/config/site";
import { fieldErrors } from "@/features/checkout/schema";
import { reservationSchema } from "@/features/reservations/place-reservation";
import {
  addDays,
  formatLongDate,
  formatTime12,
  WIZARD_STEPS,
} from "@/features/reservations/wizard";

import { ReservationTicket } from "./ReservationTicket";
import { StepBranch } from "./StepBranch";
import { StepDateTime } from "./StepDateTime";
import { StepDetails } from "./StepDetails";
import { StepSummary } from "./StepSummary";
import type { DraftUpdate, FieldErrors, ReservationDraft } from "./types";
import { useSubmitReservation } from "./use-submit-reservation";
import { WizardProgress } from "./WizardProgress";

/** Ventana de reservas: desde hoy hasta 60 días (igual que el servidor). */
const MAX_DAYS_AHEAD = 60;
const SUMMARY_STEP = WIZARD_STEPS.length - 1;
const detailsSchema = reservationSchema.pick({
  name: true,
  phone: true,
  email: true,
  acceptPrivacy: true,
});

function limaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

/** F4-05 · Pasarela de reserva en 4 pasos, pensada para cualquier edad. */
export function ReservationWizard() {
  const params = useSearchParams();
  const [today] = useState(limaToday);
  const [draft, setDraft] = useState<ReservationDraft>(() => ({
    branchSlug: params.get("sede") === "jesus-maria" ? "jesus-maria" : "lince",
    partySize: 2,
    date: "",
    time: "",
    area: "",
    occasion: "",
    name: "",
    phone: "",
    email: "",
    acceptPrivacy: false,
  }));
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Solo se mueve el foco cuando la persona cambia de paso (no al cargar la página). */
  const shouldFocusRef = useRef(false);
  const onToken = useCallback((value: string) => setToken(value), []);

  useEffect(() => {
    if (!shouldFocusRef.current) return;
    shouldFocusRef.current = false;
    const heading = headingRef.current;
    heading?.focus({ preventScroll: true });
    if (heading && heading.getBoundingClientRect().top < 80) {
      heading.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [step]);

  /** Único punto para cambiar de paso. El token antibots es de un solo uso: al salir del
   *  resumen se descarta y el widget emite uno nuevo al volver. */
  const changeStep = (index: number) => {
    shouldFocusRef.current = true;
    if (index !== SUMMARY_STEP) setToken("");
    setStep(index);
    setFurthest((f) => Math.max(f, index));
  };

  /**
   * Modo edición: se entra desde el resumen («Cambiar», el progreso o un error del
   * servidor). Al continuar se vuelve directo al resumen, sin repetir los pasos ya hechos.
   * Se guarda una copia para poder deshacer.
   */
  const [editSnapshot, setEditSnapshot] = useState<ReservationDraft | null>(null);
  const isEditing = editSnapshot !== null;

  const editStep = (index: number) => {
    setEditSnapshot((snapshot) => snapshot ?? draft);
    changeStep(index);
  };

  const undoEdit = () => {
    if (editSnapshot) setDraft(editSnapshot);
    setEditSnapshot(null);
    setErrors({});
    changeStep(SUMMARY_STEP);
  };

  const { submit, isSubmitting, formError, setFormError } = useSubmitReservation({
    onErrors: (found, index) => {
      setErrors(found);
      if (index === SUMMARY_STEP) changeStep(index);
      else editStep(index);
    },
    onSlotTaken: () => {
      setEditSnapshot((snapshot) => snapshot ?? draft);
      setDraft((d) => ({ ...d, time: "" }));
      setErrors({ time: "Esa hora se acaba de llenar. Elige otra, por favor." });
      changeStep(1);
    },
    onTokenRejected: () => setResetKey((k) => k + 1),
  });

  const update: DraftUpdate = (field, value) => {
    setDraft((d) => ({
      ...d,
      [field]: value,
      // La hora depende de la sede, el día y el número de personas.
      ...(field === "branchSlug" || field === "date" || field === "partySize" ? { time: "" } : {}),
    }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError("");
  };

  const validateStep = (index: number): FieldErrors => {
    if (index === 1 && (!draft.date || !draft.time)) {
      return { time: draft.date ? "Elige una hora para continuar." : "Elige un día y una hora." };
    }
    if (index === 2) {
      const result = detailsSchema.safeParse(draft);
      return result.success ? {} : (fieldErrors(result.error) as FieldErrors);
    }
    return {};
  };

  const hasErrors = (found: FieldErrors) => Object.values(found).some(Boolean);

  /** En edición: el primer paso que quedó incompleto (p. ej. cambiar la sede borra la hora). */
  const pendingStep = WIZARD_STEPS.slice(0, SUMMARY_STEP).findIndex(
    (_, index) => index !== step && hasErrors(validateStep(index)),
  );

  const next = () => {
    const found = validateStep(step);
    setErrors(found);
    if (hasErrors(found)) return;
    if (!isEditing) {
      changeStep(step + 1);
      return;
    }
    if (pendingStep !== -1) {
      changeStep(pendingStep);
      return;
    }
    setEditSnapshot(null);
    changeStep(SUMMARY_STEP);
  };

  const blurField = (field: keyof ReservationDraft) => {
    const found = validateStep(2);
    setErrors((e) => ({ ...e, [field]: found[field] }));
  };

  const current = WIZARD_STEPS[step];
  const nextLabel = WIZARD_STEPS[isEditing && pendingStep !== -1 ? pendingStep : step + 1]?.label;
  const returnsToSummary = isEditing && pendingStep === -1;
  const branch = BRANCHES.find((b) => b.slug === draft.branchSlug);
  const compact = [
    branch?.name,
    draft.partySize === 1 ? "1 persona" : `${draft.partySize} personas`,
    draft.date ? formatLongDate(draft.date) : null,
    draft.time ? formatTime12(draft.time) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section
        aria-labelledby="paso-titulo"
        className="border-borde bg-superficie rounded-md border p-4 shadow-sm sm:p-6"
      >
        <WizardProgress
          current={step}
          furthest={furthest}
          onGoTo={(index) =>
            step === SUMMARY_STEP || isEditing ? editStep(index) : changeStep(index)
          }
        />
        {isEditing && step !== SUMMARY_STEP ? (
          <p
            role="status"
            className="border-marino-600 bg-crema-200 mt-4 rounded-md border-l-4 px-4 py-3 font-semibold"
          >
            Estás cambiando tu reserva. Al terminar, vuelves al resumen.
          </p>
        ) : null}
        {step > 0 ? (
          <p className="bg-aji-100 mt-4 rounded-md px-3 py-2 text-sm font-semibold lg:hidden">
            {compact}
          </p>
        ) : null}

        <h2
          id="paso-titulo"
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 scroll-mt-32 text-3xl font-semibold focus:outline-none"
        >
          {current?.question}
        </h2>

        <div className="mt-5">
          {step === 0 ? <StepBranch draft={draft} update={update} /> : null}
          {step === 1 ? (
            <StepDateTime
              draft={draft}
              update={update}
              minIso={today}
              maxIso={addDays(today, MAX_DAYS_AHEAD)}
              error={errors.time ?? errors.date}
            />
          ) : null}
          {step === 2 ? (
            <StepDetails draft={draft} update={update} errors={errors} onBlur={blurField} />
          ) : null}
          {step === 3 ? (
            <StepSummary
              draft={draft}
              onEdit={editStep}
              onToken={onToken}
              resetKey={resetKey}
              tokenError={errors.turnstileToken}
            />
          ) : null}
        </div>

        {formError ? (
          <p role="alert" className="text-rocoto-texto mt-5 text-lg font-semibold">
            {formError}
          </p>
        ) : null}

        <div className="border-borde mt-8 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          {isEditing && step !== SUMMARY_STEP ? (
            <button
              type="button"
              onClick={undoEdit}
              className="text-marino min-h-tactil inline-flex items-center justify-center gap-2 px-3 text-lg font-semibold underline-offset-4 hover:underline"
            >
              <Undo2 aria-hidden="true" className="size-5" />
              Deshacer cambios
            </button>
          ) : step > 0 ? (
            <button
              type="button"
              onClick={() => changeStep(step - 1)}
              className="text-marino min-h-tactil inline-flex items-center justify-center gap-2 px-3 text-lg font-semibold underline-offset-4 hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
              Volver
            </button>
          ) : (
            <span />
          )}
          {step < SUMMARY_STEP ? (
            <Button type="button" size="lg" onClick={next}>
              {returnsToSummary ? (
                <>
                  <Check aria-hidden="true" className="size-5" />
                  Volver al resumen
                </>
              ) : (
                <>
                  <span className="sm:hidden">Siguiente</span>
                  <span className="hidden sm:inline">Siguiente: {nextLabel}</span>
                  <ArrowRight aria-hidden="true" className="size-5" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => submit(draft, token)}
              isLoading={isSubmitting}
            >
              Confirmar reserva
            </Button>
          )}
        </div>
      </section>

      <div className="hidden lg:sticky lg:top-[calc(var(--altura-header)+1rem)] lg:block">
        <ReservationTicket draft={draft} hasDate={Boolean(draft.date)} />
      </div>
    </div>
  );
}
