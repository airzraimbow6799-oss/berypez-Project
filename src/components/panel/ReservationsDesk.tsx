"use client";

import { CalendarPlus } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { ReservationsBoard } from "@/components/panel/ReservationsBoard";
import { useDemoReady } from "@/components/panel/useDemoReady";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { toast } from "@/components/ui/Toaster";
import { useDemoStore } from "@/features/demo/store";
import {
  type AreaChoice,
  checkSlot,
  DEMO_CAPACITY,
  dateKeyLima,
  slotsForDay,
  slotStart,
  UNAVAILABLE_MESSAGES,
} from "@/features/reservations/capacity";
import {
  fieldErrors,
  newReservationSchema,
  RESERVATION_BRANCHES,
  SOURCE_LABELS,
  STAFF_SOURCES,
} from "@/features/reservations/staff-form";
import { cx } from "@/components/ui/cx";

const AREA_OPTIONS: ReadonlyArray<{ value: AreaChoice; label: string }> = [
  { value: "interior", label: "Interior" },
  { value: "terraza", label: "Terraza" },
  { value: "cualquiera", label: "Me da igual" },
];

const STATE_LABELS = {
  libre: "libre",
  casi: "casi lleno",
  completo: "completo",
  pasado: "no disponible",
};

/**
 * Módulo 3 · Reservas centralizadas (con datos de ejemplo).
 * Muestra el cupo de cada franja del día, la lista de reservas de la sede y el botón
 * «Nueva reserva» para anotar las que llegan por llamada o WhatsApp. Lo completo queda
 * tachado, igual que en la web.
 */
export function ReservationsDesk() {
  const isReady = useDemoReady();
  const reservations = useDemoStore((s) => s.reservations);
  const setStatus = useDemoStore((s) => s.setReservationStatus);

  const [branch, setBranch] = useState<string>(RESERVATION_BRANCHES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [initialTime, setInitialTime] = useState("");

  if (!isReady) {
    return (
      <div className="mt-6" aria-busy="true">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  const now = Date.now();
  const today = dateKeyLima(now);
  const slots = slotsForDay(reservations, branch, today, now);
  const ofBranch = reservations.filter((r) => r.branch === branch);

  const openNew = (time = "") => {
    setInitialTime(time);
    setOpenCount((n) => n + 1);
    setIsOpen(true);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Reservas</h1>
          <p className="text-tinta-suave mt-1 max-w-prose">
            Todas las reservas en un solo lugar: de la web, por llamada o por WhatsApp. Lo que ya
            está completo queda tachado en la web.
          </p>
        </div>
        <Button onClick={() => openNew()}>
          <CalendarPlus aria-hidden="true" className="size-5" /> Nueva reserva
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Sede">
        {RESERVATION_BRANCHES.map((name) => (
          <Chip key={name} pressed={branch === name} onPressedChange={() => setBranch(name)}>
            {name}
          </Chip>
        ))}
      </div>

      <section aria-labelledby="ocupacion" className="mt-5">
        <h2 id="ocupacion" className="text-xl font-semibold">
          Hoy · ocupación por franja
        </h2>
        <p className="text-tinta-suave mt-1 text-sm">
          Aforo de {DEMO_CAPACITY.seatsPerSlot} personas por franja y hasta{" "}
          {DEMO_CAPACITY.terraceMaxParties} reservas de terraza a la misma hora.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {slots.map((slot) => {
            const isClosed = slot.state === "completo" || slot.state === "pasado";
            const percent = Math.min(100, (slot.seats / DEMO_CAPACITY.seatsPerSlot) * 100);
            return (
              <li key={slot.time}>
                <button
                  type="button"
                  disabled={isClosed}
                  onClick={() => openNew(slot.time)}
                  aria-label={`${slot.time}, ${slot.seats} de ${DEMO_CAPACITY.seatsPerSlot} personas, terraza ${slot.terraceParties} de ${DEMO_CAPACITY.terraceMaxParties}, ${STATE_LABELS[slot.state]}`}
                  className={cx(
                    "min-h-tactil border-borde w-full rounded-sm border p-2 text-left transition-colors disabled:cursor-not-allowed",
                    slot.state === "completo" && "bg-marino text-crema",
                    slot.state === "pasado" && "bg-crema-200 text-tinta-suave opacity-70",
                    slot.state === "casi" && "bg-aji-100 hover:border-marino-600",
                    slot.state === "libre" && "bg-superficie hover:border-marino-600",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={cx(
                        "font-semibold tabular-nums",
                        slot.state === "completo" && "line-through",
                      )}
                    >
                      {slot.time}
                    </span>
                    <span className="text-xs tabular-nums">
                      {slot.seats}/{DEMO_CAPACITY.seatsPerSlot}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="bg-crema-200 mt-1 block h-1.5 overflow-hidden rounded-full"
                  >
                    <span
                      className={cx(
                        "barra-avanza block h-full origin-left rounded-full",
                        slot.state === "completo" ? "bg-aji" : "bg-marino",
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="mt-1 block text-xs">
                    {slot.state === "pasado"
                      ? "No disponible"
                      : slot.state === "completo"
                        ? "Completo"
                        : slot.terraceFull
                          ? "Terraza completa"
                          : `Terraza ${slot.terraceParties}/${DEMO_CAPACITY.terraceMaxParties}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <ReservationsBoard reservations={ofBranch} onStatusChange={setStatus} />

      <NewReservationDialog
        key={openCount}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        initialBranch={branch}
        initialTime={initialTime}
        onSaved={() => setIsOpen(false)}
      />
    </div>
  );
}

type FormState = {
  branch: string;
  date: string;
  time: string;
  partySize: number;
  area: AreaChoice;
  name: string;
  phone: string;
  email: string;
  notes: string;
  source: string;
};

function NewReservationDialog({
  open,
  onClose,
  initialBranch,
  initialTime,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialBranch: string;
  initialTime: string;
  onSaved: () => void;
}) {
  const formId = useId();
  const reservations = useDemoStore((s) => s.reservations);
  const addReservation = useDemoStore((s) => s.addReservation);
  const [now] = useState(() => Date.now());
  const [form, setForm] = useState<FormState>(() => ({
    branch: initialBranch,
    date: dateKeyLima(Date.now()),
    time: initialTime,
    partySize: 2,
    area: "cualquiera",
    name: "",
    phone: "",
    email: "",
    notes: "",
    source: "phone",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const slots = slotsForDay(reservations, form.branch, form.date, now);
  const chosen = slots.find((s) => s.time === form.time);
  const terraceBlocked = Boolean(chosen?.terraceFull);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = newReservationSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    const data = parsed.data;
    const check = checkSlot(reservations, {
      branch: data.branch,
      date: data.date,
      time: data.time,
      partySize: data.partySize,
      area: data.area,
      now: Date.now(),
    });
    if (!check.ok) {
      setErrors({ time: UNAVAILABLE_MESSAGES[check.reason] });
      return;
    }
    const created = addReservation({
      startsAt: slotStart(data.date, data.time).toISOString(),
      partySize: data.partySize,
      area: data.area === "cualquiera" ? null : data.area,
      occasion: data.notes || null,
      name: data.name,
      phone: data.phone,
      status: "confirmed",
      branch: data.branch,
      source: data.source,
      notes: data.notes || null,
      email: data.email || null,
    });
    toast.success(
      data.email
        ? `Reserva guardada para ${created.name}. Se enviaría un correo de confirmación.`
        : `Reserva guardada para ${created.name}.`,
    );
    onSaved();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="modal"
      title="Nueva reserva"
      description="Para las que llegan por llamada o WhatsApp. Cuenta igual que las de la web."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="fantasma" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Guardar reserva
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Choice
          legend="¿Cómo llegó?"
          value={form.source}
          onChange={(v) => set("source", v)}
          error={errors.source}
          options={STAFF_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
        />
        <Choice
          legend="Sede"
          value={form.branch}
          onChange={(v) => set("branch", v)}
          options={RESERVATION_BRANCHES.map((b) => ({ value: b, label: b }))}
        />
        <Input
          label="Día"
          type="date"
          name="date"
          min={dateKeyLima(now)}
          value={form.date}
          error={errors.date}
          onChange={(e) => set("date", e.target.value)}
        />

        <fieldset>
          <legend className="font-semibold">Hora</legend>
          <p className="text-tinta-suave text-sm">Las horas completas aparecen tachadas.</p>
          <div
            className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5"
            role="radiogroup"
            aria-label="Hora"
          >
            {slots.map((slot) => {
              const isClosed = slot.state === "completo" || slot.state === "pasado";
              const isChosen = form.time === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  disabled={isClosed}
                  title={
                    isClosed
                      ? slot.state === "pasado"
                        ? "Ya no se puede reservar"
                        : "Completo"
                      : undefined
                  }
                  onClick={() => set("time", slot.time)}
                  className={cx(
                    "min-h-tactil rounded-sm border text-sm font-semibold tabular-nums transition-colors disabled:cursor-not-allowed",
                    isChosen
                      ? "border-marino bg-marino text-crema"
                      : "border-borde bg-superficie hover:border-marino-600",
                    isClosed && "bg-crema-200 text-tinta-suave line-through opacity-70",
                    slot.state === "casi" && !isChosen && "bg-aji-100",
                  )}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
          {errors.time ? (
            <p role="alert" className="text-rocoto-texto mt-1 text-sm font-semibold">
              {errors.time}
            </p>
          ) : null}
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">Personas</span>
          <Stepper
            value={form.partySize}
            onChange={(v) => set("partySize", v)}
            itemName="comensal"
            min={1}
            max={20}
          />
        </div>

        <Choice
          legend="Zona"
          value={form.area}
          onChange={(v) => set("area", v as AreaChoice)}
          error={errors.area}
          options={AREA_OPTIONS.map((o) => ({
            ...o,
            disabled: o.value === "terraza" && terraceBlocked,
          }))}
          hint={
            terraceBlocked
              ? "La terraza está completa a esta hora. Elige interior o «me da igual»."
              : undefined
          }
        />

        <Input
          label="Nombre"
          name="name"
          autoComplete="off"
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <Input
          label="Celular"
          name="phone"
          inputMode="numeric"
          required
          value={form.phone}
          error={errors.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
        <Input
          label="Correo"
          name="email"
          type="email"
          hint="Opcional. Con correo se envía la confirmación («llega 15 minutos antes»)."
          value={form.email}
          error={errors.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          label="Observación"
          name="notes"
          hint="Por ejemplo: aniversario, silla para bebé."
          value={form.notes}
          error={errors.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </form>
    </Dialog>
  );
}

/** Grupo de botones de opción única (radio) con 48 px de alto, para elegir sin teclear. */
function Choice({
  legend,
  value,
  onChange,
  options,
  error,
  hint,
}: {
  legend: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  error?: string;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="font-semibold">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const isChosen = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
              className={cx(
                "min-h-tactil rounded-pill border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                isChosen
                  ? "border-marino bg-marino text-crema"
                  : "border-borde bg-superficie hover:border-marino-600",
                option.disabled && "line-through",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {hint ? <p className="text-tinta-suave mt-1 text-sm">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-rocoto-texto mt-1 text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
