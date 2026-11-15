/**
 * F2-04 · Crear un pedido. Orden de las reglas:
 * 1) datos válidos → 2) límite de peticiones → 3) antibots → 4) medio de pago →
 * 5) sede/zona → 6) horario → 7) precios desde la base → 8) mínimo y vuelto → 9) guardar.
 */
import type { ApiResponse } from "@/lib/api/response";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

import { isWithinHours } from "./hours";
import { quoteCart } from "./quote";
import { checkoutSchema, fieldErrors } from "./schema";
import type { Branch, NewOrder, Zone } from "./server";

export type CheckoutDeps = {
  verifyTurnstile: (token: string, ip: string | null) => Promise<boolean>;
  hitRateLimit: (key: string, limit: number, windowSeconds: number) => Promise<boolean>;
  getBranchesAndZones: () => Promise<{ branches: Branch[]; zones: Zone[] }>;
  getProductsByIds: (ids: readonly number[]) => Promise<Map<number, Product>>;
  createOrder: (order: NewOrder) => Promise<{ orderId: number; trackingToken: string }>;
};

export type CheckoutContext = { ip: string | null; now: Date };

type Created = { orderId: number; trackingToken: string; totalCents: number };
type Result = { status: number; body: ApiResponse<Created> };

// F2-15: 10 pedidos por IP y 5 por celular cada 10 minutos.
const WINDOW_SECONDS = 600;
const LIMIT_PER_IP = 10;
const LIMIT_PER_PHONE = 5;
// Pedido programado: desde 30 minutos hasta 7 días después.
const MIN_LEAD_MS = 30 * 60 * 1000;
const MAX_AHEAD_MS = 7 * 24 * 60 * 60 * 1000;

const fail = (
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): Result => ({
  status,
  body: { success: false, error: { code, message, ...(fields ? { fields } : {}) } },
});

const invalid = (fields: Record<string, string>) =>
  fail(400, "invalid_input", "Revisa los datos marcados.", fields);

export async function placeOrder(
  input: unknown,
  { ip, now }: CheckoutContext,
  deps: CheckoutDeps,
): Promise<Result> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return invalid(fieldErrors(parsed.error));
  }
  const data = parsed.data;

  try {
    const [ipOk, phoneOk] = await Promise.all([
      deps.hitRateLimit(`checkout:ip:${ip ?? "desconocida"}`, LIMIT_PER_IP, WINDOW_SECONDS),
      deps.hitRateLimit(`checkout:cel:${data.phone}`, LIMIT_PER_PHONE, WINDOW_SECONDS),
    ]);
    if (!ipOk || !phoneOk) {
      return fail(
        429,
        "too_many_requests",
        "Hiciste muchos pedidos seguidos. Espera unos minutos.",
      );
    }

    if (!(await deps.verifyTurnstile(data.turnstileToken, ip))) {
      return fail(
        403,
        "turnstile_failed",
        "No pudimos confirmar que no eres un robot. Inténtalo otra vez.",
      );
    }

    if (data.paymentMethod !== "cash") {
      return invalid({
        paymentMethod:
          "Por ahora puedes pagar en efectivo al recibir. Yape, Plin y tarjeta llegan pronto.",
      });
    }

    const { branches, zones } = await deps.getBranchesAndZones();
    const zone =
      data.modality === "delivery" ? zones.find((z) => z.district === data.district) : undefined;
    if (data.modality === "delivery" && !zone) {
      return invalid({ district: "Por ahora no llegamos a ese distrito. Puedes elegir recojo." });
    }
    const branch = zone
      ? branches.find((b) => b.id === zone.branchId)
      : branches.find((b) => b.slug === data.branchSlug);
    if (!branch) {
      return invalid({ branchSlug: "Elige una sede." });
    }

    let scheduledFor: Date | null = null;
    if (data.scheduledFor) {
      scheduledFor = new Date(data.scheduledFor);
      const ahead = scheduledFor.getTime() - now.getTime();
      if (ahead < MIN_LEAD_MS || ahead > MAX_AHEAD_MS) {
        return invalid({
          scheduledFor: "Elige una hora desde 30 minutos y hasta 7 días desde ahora.",
        });
      }
      if (!isWithinHours(branch.openingHours, scheduledFor)) {
        return invalid({ scheduledFor: `${branch.name} no atiende a esa hora. Elige otra.` });
      }
    } else if (!isWithinHours(branch.openingHours, now)) {
      return fail(409, "closed", `${branch.name} está cerrado ahora. Puedes programar tu pedido.`);
    }

    const products = await deps.getProductsByIds(data.items.map((i) => i.productId));
    const quote = quoteCart(data.items, products, zone ?? null);
    if (quote.issues.length > 0) {
      return fail(409, "cart_changed", quote.issues.map((i) => i.message).join(" "));
    }
    if (quote.missingForMinimumCents > 0) {
      return fail(
        409,
        "below_minimum",
        `Te faltan ${formatPrice(quote.missingForMinimumCents)} para el pedido mínimo.`,
      );
    }
    if (data.cashChangeForCents !== null && data.cashChangeForCents < quote.totalCents) {
      return invalid({
        cashChangeForCents: `Debe ser igual o mayor al total (${formatPrice(quote.totalCents)}).`,
      });
    }

    const created = await deps.createOrder({
      order: {
        branch_id: branch.id,
        modality: data.modality,
        customer_name: data.name,
        customer_phone: data.phone,
        customer_email: data.email || null,
        address: data.modality === "delivery" ? data.address : null,
        address_reference: data.modality === "delivery" ? data.addressReference || null : null,
        district: zone?.district ?? null,
        scheduled_for: scheduledFor?.toISOString() ?? null,
        notes: data.notes || null,
        subtotal_cents: quote.subtotalCents,
        delivery_cents: quote.deliveryCents,
        total_cents: quote.totalCents,
        payment_method: data.paymentMethod,
        cash_change_for_cents: data.cashChangeForCents,
      },
      items: quote.lines.map((line) => ({
        product_id: line.productId,
        variant_id: line.variantId,
        product_name: line.name,
        variant_label: line.variantLabel,
        choices: line.choices,
        quantity: line.quantity,
        unit_price_cents: line.unitPriceCents,
        line_total_cents: line.lineTotalCents,
        notes: line.note || null,
      })),
    });

    return {
      status: 201,
      body: { success: true, data: { ...created, totalCents: quote.totalCents } },
    };
  } catch {
    return fail(
      500,
      "order_failed",
      "No pudimos registrar tu pedido. Inténtalo de nuevo o escríbenos por WhatsApp.",
    );
  }
}
