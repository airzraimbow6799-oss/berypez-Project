"use client";

import { CalendarCheck, ChartNoAxesColumn, ShoppingBag, Wallet } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";

import { AnimatedNumber } from "@/components/panel/AnimatedNumber";
import { useDemoReady } from "@/components/panel/useDemoReady";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  byBranch,
  modalityBreakdown,
  reservationsToday,
  statusBreakdown,
  todaySummary,
  topDishes,
  weekSeries,
} from "@/features/dashboard/metrics";
import { useDemoStore } from "@/features/demo/store";
import { RESERVATION_BRANCHES } from "@/features/reservations/staff-form";
import { formatPrice } from "@/lib/format";

const formatCents = (cents: number) => formatPrice(cents);
const formatCount = (n: number) => String(n);
/** «1,120» sin céntimos ni «S/», para las etiquetas de las barras (el título dice «en soles»). */
const formatSoles = (cents: number) => Math.round(cents / 100).toLocaleString("en-US");

const stagger = (index: number): CSSProperties => ({ "--i": index }) as CSSProperties;

/**
 * Módulo 6 · Dashboard (con datos de ejemplo). Ventas, pedidos, platos más pedidos y reservas
 * en una sola pantalla. Los números cuentan al aparecer y las barras crecen; con «reducir
 * movimiento» todo se ve ya terminado.
 */
export function DashboardView() {
  const isReady = useDemoReady();
  const orders = useDemoStore((s) => s.orders);
  const reservations = useDemoStore((s) => s.reservations);
  const history = useDemoStore((s) => s.salesHistoryCents);
  const [branch, setBranch] = useState<string | null>(null);

  if (!isReady) {
    return (
      <div className="mt-6" aria-busy="true">
        <Skeleton className="h-9 w-56" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  const now = Date.now();
  const scopedOrders = byBranch(orders, branch);
  const scopedReservations = byBranch(reservations, branch);
  const today = todaySummary(scopedOrders, now);
  const series = weekSeries(branch ? [] : history, today.salesCents, now);
  const maxCents = Math.max(1, ...series.map((p) => p.cents));
  const dishes = topDishes(scopedOrders, now);
  const maxDish = Math.max(1, ...dishes.map((d) => d.quantity));
  const statuses = statusBreakdown(scopedOrders, now);
  const modality = modalityBreakdown(scopedOrders, now);
  const bookings = reservationsToday(scopedReservations, now);
  const yesterday = history.at(-1);

  const kpis = [
    {
      label: "Ventas de hoy",
      icon: Wallet,
      value: today.salesCents,
      format: formatCents,
      note: !branch && yesterday ? `Ayer: ${formatPrice(yesterday)}` : "Pedidos no cancelados",
    },
    {
      label: "Pedidos de hoy",
      icon: ShoppingBag,
      value: today.orders,
      format: formatCount,
      note: `${modality.delivery} delivery · ${modality.pickup} recojo`,
    },
    {
      label: "Ticket promedio",
      icon: ChartNoAxesColumn,
      value: today.averageCents,
      format: formatCents,
      note: "Por pedido",
    },
    {
      label: "Reservas de hoy",
      icon: CalendarCheck,
      value: bookings.count,
      format: formatCount,
      note: `${bookings.people} personas`,
    },
  ];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Resumen</h1>
          <p className="text-tinta-suave mt-1 max-w-prose">
            Cómo va el día. Se actualiza al instante cuando entra un pedido o una reserva.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sede">
          <Chip pressed={branch === null} onPressedChange={() => setBranch(null)}>
            Todas
          </Chip>
          {RESERVATION_BRANCHES.map((name) => (
            <Chip key={name} pressed={branch === name} onPressedChange={() => setBranch(name)}>
              {name}
            </Chip>
          ))}
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className="entra bg-superficie border-borde rounded-md border p-4 shadow-sm"
            style={stagger(index)}
          >
            <dt className="text-tinta-suave flex items-center gap-2 text-sm font-semibold">
              <kpi.icon aria-hidden="true" className="size-4" /> {kpi.label}
            </dt>
            <dd className="mt-1 text-3xl font-semibold">
              <AnimatedNumber value={kpi.value} format={kpi.format} />
            </dd>
            <dd className="text-tinta-suave mt-0.5 text-sm">{kpi.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section
          aria-labelledby="ventas-7"
          className="entra bg-superficie border-borde rounded-md border p-4 shadow-sm"
          style={stagger(4)}
        >
          <h2 id="ventas-7" className="text-xl font-semibold">
            Ventas de los últimos 7 días
          </h2>
          <p className="text-tinta-suave mt-1 text-sm">En soles (S/).</p>
          {branch ? (
            <p className="text-tinta-suave mt-1 text-sm">
              El historial de días anteriores es de todas las sedes; aquí solo se ve hoy.
            </p>
          ) : null}
          <figure className="mt-4">
            <ul className="flex h-52 items-end gap-2 sm:gap-3" aria-hidden="true">
              {series.map((point, index) => (
                <li key={point.key} className="flex h-full flex-1 flex-col justify-end gap-1">
                  <span
                    className={`text-center text-[11px] font-semibold whitespace-nowrap tabular-nums sm:text-xs ${point.isToday ? "" : "text-tinta-suave"}`}
                  >
                    {formatSoles(point.cents)}
                  </span>
                  <span
                    className={`barra-sube block w-full origin-bottom rounded-t-sm ${point.isToday ? "bg-aji" : "bg-marino"}`}
                    style={{ height: `${(point.cents / maxCents) * 80}%`, ...stagger(index) }}
                  />
                </li>
              ))}
            </ul>
            <ul className="mt-1 flex gap-2 sm:gap-3" aria-hidden="true">
              {series.map((point) => (
                <li
                  key={point.key}
                  className={`flex-1 text-center text-xs capitalize ${point.isToday ? "font-bold" : "text-tinta-suave"}`}
                >
                  {point.isToday ? "Hoy" : point.label}
                </li>
              ))}
            </ul>
            <table className="sr-only">
              <caption>Ventas por día</caption>
              <thead>
                <tr>
                  <th scope="col">Día</th>
                  <th scope="col">Ventas</th>
                </tr>
              </thead>
              <tbody>
                {series.map((point) => (
                  <tr key={point.key}>
                    <th scope="row">{point.isToday ? "Hoy" : point.label}</th>
                    <td>{formatPrice(point.cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        </section>

        <section
          aria-labelledby="top-platos"
          className="entra bg-superficie border-borde rounded-md border p-4 shadow-sm"
          style={stagger(5)}
        >
          <h2 id="top-platos" className="text-xl font-semibold">
            Platos más pedidos hoy
          </h2>
          {dishes.length === 0 ? (
            <p className="text-tinta-suave mt-3">Todavía no hay pedidos hoy.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-3">
              {dishes.map((dish, index) => (
                <li key={dish.name}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold">{dish.name}</span>
                    <span className="text-tinta-suave tabular-nums">{dish.quantity}</span>
                  </div>
                  <span
                    aria-hidden="true"
                    className="bg-crema-200 mt-1 block h-2 overflow-hidden rounded-full"
                  >
                    <span
                      className="barra-avanza bg-marino block h-full origin-left rounded-full"
                      style={{ width: `${(dish.quantity / maxDish) * 100}%`, ...stagger(index) }}
                    />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section
          aria-labelledby="estados"
          className="entra bg-superficie border-borde rounded-md border p-4 shadow-sm"
          style={stagger(6)}
        >
          <h2 id="estados" className="text-xl font-semibold">
            Pedidos por estado
          </h2>
          {statuses.length === 0 ? (
            <p className="text-tinta-suave mt-3">Todavía no hay pedidos hoy.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {statuses.map((row) => (
                <li
                  key={row.status}
                  className="bg-crema-200 rounded-pill px-3 py-1 text-sm font-semibold"
                >
                  {row.label}: <span className="tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="reservas-hoy"
          className="entra bg-superficie border-borde rounded-md border p-4 shadow-sm"
          style={stagger(7)}
        >
          <h2 id="reservas-hoy" className="text-xl font-semibold">
            Próximas reservas de hoy
          </h2>
          {bookings.upcoming.length === 0 ? (
            <p className="text-tinta-suave mt-3">No quedan reservas para hoy.</p>
          ) : (
            <ul className="divide-borde mt-3 divide-y">
              {bookings.upcoming.map((r) => (
                <li
                  key={`${r.time}-${r.name}`}
                  className="flex items-baseline justify-between gap-3 py-2"
                >
                  <span>
                    <span className="font-semibold tabular-nums">{r.time}</span> · {r.name}
                  </span>
                  <span className="text-tinta-suave text-sm">{r.partySize} personas</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
