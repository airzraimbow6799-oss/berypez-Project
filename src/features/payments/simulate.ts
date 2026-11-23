import { onlyDigits } from "./card";

/**
 * Pago SIMULADO para la demostración del checkout. No llama a ninguna pasarela, no cobra y no
 * crea pedidos: solo deja ver cómo se sentiría pagar y qué pasa si el pago falla. La pasarela
 * real (Culqi, Izipay, Niubiz o Mercado Pago) reemplaza esto detrás de la misma interfaz.
 */

export type PaymentMethodId = "cash" | "yape" | "plin" | "card";

export const METHOD_LABELS: Record<PaymentMethodId, string> = {
  cash: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  card: "Tarjeta",
};

export type PayInput = {
  method: Exclude<PaymentMethodId, "cash">;
  phone: string;
  yapeCode: string;
  cardNumber: string;
};

export type PayOutcome = { ok: true; reference: string } | { ok: false; message: string };

/** Cuánto «tarda» cada medio: Plin espera la aprobación en la app del cliente. */
export const SIMULATED_DELAY_MS: Record<PayInput["method"], number> = {
  card: 1800,
  yape: 1500,
  plin: 3600,
};

export const WAITING_MESSAGES: Record<PayInput["method"], string> = {
  card: "Procesando tu pago con seguridad…",
  yape: "Validando tu código de Yape…",
  plin: "Esperando que apruebes el pago en tu app de Plin…",
};

const reference = () => `SIM-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;

export async function simulatePayment(
  input: PayInput,
  { delayMs = SIMULATED_DELAY_MS[input.method] }: { delayMs?: number } = {},
): Promise<PayOutcome> {
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));

  if (input.method === "card" && onlyDigits(input.cardNumber).endsWith("0002")) {
    return {
      ok: false,
      message: "Tu banco rechazó la tarjeta. Prueba con otra o elige otro medio.",
    };
  }
  if (input.method === "yape" && onlyDigits(input.yapeCode) === "000000") {
    return { ok: false, message: "El código no es válido o venció. Genera uno nuevo en Yape." };
  }
  return { ok: true, reference: reference() };
}

export type OnlineErrors = Partial<Record<"phone" | "yapeCode", string>>;

/** Validación de pantalla de Yape y Plin (la tarjeta tiene la suya en `card.ts`). */
export function validateWallet(
  method: "yape" | "plin",
  phone: string,
  yapeCode: string,
): OnlineErrors {
  const errors: OnlineErrors = {};
  if (!/^9\d{8}$/.test(onlyDigits(phone))) {
    errors.phone = "El celular tiene 9 dígitos y empieza con 9.";
  }
  if (method === "yape" && onlyDigits(yapeCode).length !== 6) {
    errors.yapeCode = "El código de Yape tiene 6 dígitos.";
  }
  return errors;
}
