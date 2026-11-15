/** Precio en soles a partir de céntimos enteros: 4800 → "S/ 48.00". */
export function formatPrice(cents: number): string {
  const amount = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `S/ ${amount}`;
}

/** “Desde S/ 42.00” cuando las variantes tienen precios distintos. */
export function formatPriceFrom(priceCents: number, variantPrices: readonly number[]): string {
  const distinct = new Set(variantPrices);
  return distinct.size > 1 ? `Desde ${formatPrice(priceCents)}` : formatPrice(priceCents);
}
