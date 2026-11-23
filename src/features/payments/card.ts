/**
 * Ayudas de la tarjeta para el formulario de pago: marca, formato, validación y vencimiento.
 * Son reglas de pantalla para ayudar a quien paga; la pasarela real valida de nuevo y es la
 * única que ve el número completo (la web nunca lo guarda ni lo envía a nuestro servidor).
 */

export type CardBrand = "visa" | "mastercard" | "amex" | "diners" | "desconocida";

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  diners: "Diners Club",
  desconocida: "Tarjeta",
};

export const onlyDigits = (text: string): string => text.replace(/\D/g, "");

/** Marca por los primeros dígitos (el prefijo del emisor). */
export function detectBrand(raw: string): CardBrand {
  const d = onlyDigits(raw);
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5])/.test(d)) return "mastercard";
  const two = Number(d.slice(0, 4));
  if (d.length >= 4 && two >= 2221 && two <= 2720) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^(36|38|39|30[0-5])/.test(d)) return "diners";
  return "desconocida";
}

export const cardLength = (brand: CardBrand): number =>
  brand === "amex" ? 15 : brand === "diners" ? 14 : 16;

export const cvvLength = (brand: CardBrand): number => (brand === "amex" ? 4 : 3);

/** «4111111111111111» → «4111 1111 1111 1111» (Amex 4-6-5, Diners 4-6-4). */
export function formatCardNumber(raw: string): string {
  const brand = detectBrand(raw);
  const d = onlyDigits(raw).slice(0, cardLength(brand));
  const cuts = brand === "amex" ? [4, 10] : brand === "diners" ? [4, 10] : [4, 8, 12];
  const parts: string[] = [];
  let from = 0;
  for (const cut of cuts) {
    if (d.length > from) parts.push(d.slice(from, cut));
    from = cut;
  }
  if (d.length > from) parts.push(d.slice(from));
  return parts.join(" ");
}

/** Algoritmo de Luhn: detecta números mal escritos antes de enviarlos. */
export function passesLuhn(raw: string): boolean {
  const d = onlyDigits(raw);
  if (d.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = Number(d[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** «1228» → «12/28»: pone la barra sola mientras se escribe. */
export function formatExpiry(raw: string): string {
  const d = onlyDigits(raw).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export type FieldCheck = { ok: true } | { ok: false; message: string };

export function checkExpiry(text: string, now: Date = new Date()): FieldCheck {
  const d = onlyDigits(text);
  if (d.length < 4) return { ok: false, message: "Escribe mes y año, por ejemplo 08/28." };
  const month = Number(d.slice(0, 2));
  const year = 2000 + Number(d.slice(2, 4));
  if (month < 1 || month > 12) return { ok: false, message: "El mes va de 01 a 12." };
  // Una tarjeta vale hasta el último día del mes de vencimiento.
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  if (endOfMonth.getTime() < now.getTime())
    return { ok: false, message: "La tarjeta está vencida." };
  if (year > now.getFullYear() + 20) return { ok: false, message: "Revisa el año de vencimiento." };
  return { ok: true };
}

export type CardInput = { number: string; name: string; expiry: string; cvv: string };
export type CardErrors = Partial<Record<keyof CardInput, string>>;

export function validateCard(input: CardInput, now: Date = new Date()): CardErrors {
  const errors: CardErrors = {};
  const brand = detectBrand(input.number);
  const digits = onlyDigits(input.number);
  if (digits.length === 0) errors.number = "Escribe el número de tu tarjeta.";
  else if (digits.length !== cardLength(brand) || !passesLuhn(digits)) {
    errors.number = "El número no es válido. Revísalo.";
  }
  if (input.name.trim().length < 3) errors.name = "Escribe el nombre como figura en la tarjeta.";
  const expiry = checkExpiry(input.expiry, now);
  if (!expiry.ok) errors.expiry = expiry.message;
  if (onlyDigits(input.cvv).length !== cvvLength(brand)) {
    errors.cvv = `Son ${cvvLength(brand)} dígitos, atrás de la tarjeta.`;
  }
  return errors;
}

/** Tarjetas de prueba para la demostración (números públicos de pruebas, no de personas). */
export const TEST_CARDS = {
  aprobada: "4111 1111 1111 1111",
  rechazada: "4000 0000 0000 0002",
} as const;
