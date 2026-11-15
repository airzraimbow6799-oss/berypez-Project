import Link from "next/link";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = { title: "Cambios y devoluciones" };

/** Política adaptada a alimentos (la anterior era de una tienda de productos). */
export default function ReturnsPage() {
  return (
    <LegalPage title="Cambios y devoluciones">
      <p>Por tratarse de comida preparada al momento, los cambios funcionan así:</p>
      <h2>Si algo no está bien</h2>
      <ul>
        <li>
          Si recibes un plato distinto al que pediste, incompleto o en mal estado, avísanos al
          recibirlo.
        </li>
        <li>Te lo cambiamos o te devolvemos el importe de ese plato, según prefieras.</li>
        <li>Si pagaste en línea, la devolución se hace al mismo medio de pago.</li>
      </ul>
      <h2>Cancelaciones</h2>
      <ul>
        <li>Puedes cancelar sin costo mientras el pedido no haya pasado a cocina.</li>
        <li>Una vez en preparación, no es posible cancelarlo.</li>
      </ul>
      <h2>Reclamos</h2>
      <p>
        También puedes registrar tu caso en el{" "}
        <Link href="/libro-de-reclamaciones" className="underline underline-offset-4">
          Libro de Reclamaciones
        </Link>
        .
      </p>
    </LegalPage>
  );
}
