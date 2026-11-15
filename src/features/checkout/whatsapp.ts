/** F2-11 · Mensaje de pedido por WhatsApp con el carrito completo (no solo un plato). */
import { formatPrice } from "@/lib/format";

type MessageLine = {
  name: string;
  variantLabel: string | null;
  choices: Record<string, string>;
  note: string;
  quantity: number;
  unitPriceCents: number;
};

export function whatsappOrderMessage(lines: readonly MessageLine[], modeLabel: string): string {
  const body = lines.flatMap((line) => {
    const title = line.variantLabel ? `${line.name} (${line.variantLabel})` : line.name;
    const rows = [
      `• ${line.quantity} × ${title} — ${formatPrice(line.unitPriceCents * line.quantity)}`,
    ];
    const choices = Object.values(line.choices);
    if (choices.length > 0) rows.push(`   ${choices.join(", ")}`);
    if (line.note) rows.push(`   Nota: ${line.note}`);
    return rows;
  });
  const subtotal = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  return [
    `Hola Berypez, quiero hacer este pedido (${modeLabel}):`,
    "",
    ...body,
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
  ].join("\n");
}
