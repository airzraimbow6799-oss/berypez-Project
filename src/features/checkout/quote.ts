/**
 * F2-01 · Cotizador. Recalcula el pedido con los precios de la base de datos.
 * Del navegador solo se usa QUÉ platos y CUÁNTOS: nunca el precio.
 */
import type { Product } from "@/types/catalog";

export type QuoteItem = {
  productId: number;
  variantId: number | null;
  quantity: number;
  choices: Record<string, string>;
  note: string;
};

export type QuoteIssueCode =
  "not_found" | "unavailable" | "invalid_variant" | "missing_choice" | "invalid_choice";

export type QuoteIssue = { index: number; code: QuoteIssueCode; message: string };

export type QuotedLine = {
  productId: number;
  variantId: number | null;
  name: string;
  variantLabel: string | null;
  choices: Record<string, string>;
  note: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type Quote = {
  lines: QuotedLine[];
  subtotalCents: number;
  deliveryCents: number;
  totalCents: number;
  missingForMinimumCents: number;
  issues: QuoteIssue[];
};

export type DeliveryTerms = { feeCents: number; minOrderCents: number } | null;

function quoteItem(item: QuoteItem, index: number, product: Product | undefined) {
  if (!product) {
    return {
      issue: { index, code: "not_found" as const, message: "Este plato ya no está en la carta." },
    };
  }
  if (!product.isAvailable) {
    return {
      issue: { index, code: "unavailable" as const, message: `${product.name} está agotado.` },
    };
  }

  const variant = product.variants.find((v) => v.id === item.variantId);
  if (product.variants.length > 0 && !variant) {
    return {
      issue: {
        index,
        code: "invalid_variant" as const,
        message: `Elige una opción de ${product.name}.`,
      },
    };
  }
  if (variant && !variant.isAvailable) {
    return {
      issue: {
        index,
        code: "unavailable" as const,
        message: `${product.name} (${variant.label}) está agotado.`,
      },
    };
  }

  const groups = product.choiceGroups.filter(
    (group) => (variant?.selections[group.key] ?? null) === null,
  );
  const choices: Record<string, string> = {};
  for (const group of groups) {
    const chosen = item.choices[group.key];
    if (chosen === undefined) {
      return {
        issue: {
          index,
          code: "missing_choice" as const,
          message: `${product.name}: ${group.label.toLowerCase()}.`,
        },
      };
    }
    if (!group.options.includes(chosen)) {
      return {
        issue: {
          index,
          code: "invalid_choice" as const,
          message: `${product.name}: esa opción no existe.`,
        },
      };
    }
    choices[group.key] = chosen;
  }

  const unitPriceCents = variant?.priceCents ?? product.priceCents;
  const line: QuotedLine = {
    productId: product.id,
    variantId: variant?.id ?? null,
    name: product.name,
    variantLabel: product.variants.length > 1 ? (variant?.label ?? null) : null,
    choices,
    note: item.note.trim().slice(0, 200),
    quantity: item.quantity,
    unitPriceCents,
    lineTotalCents: unitPriceCents * item.quantity,
  };
  return { line };
}

export function quoteCart(
  items: readonly QuoteItem[],
  catalog: ReadonlyMap<number, Product>,
  delivery: DeliveryTerms,
): Quote {
  const lines: QuotedLine[] = [];
  const issues: QuoteIssue[] = [];
  items.forEach((item, index) => {
    const result = quoteItem(item, index, catalog.get(item.productId));
    if ("issue" in result && result.issue) issues.push(result.issue);
    if ("line" in result && result.line) lines.push(result.line);
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const deliveryCents = delivery?.feeCents ?? 0;
  return {
    lines,
    subtotalCents,
    deliveryCents,
    totalCents: subtotalCents + deliveryCents,
    missingForMinimumCents: Math.max(0, (delivery?.minOrderCents ?? 0) - subtotalCents),
    issues,
  };
}
