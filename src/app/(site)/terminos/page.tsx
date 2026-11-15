import Link from "next/link";

import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY } from "@/config/legal";

export const metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return (
    <LegalPage title="Términos y condiciones">
      <p>
        Estos términos rigen los pedidos y reservas hechos en la web de {COMPANY.tradeName}. Al
        confirmar un pedido o una reserva, aceptas estas condiciones.
      </p>
      <h2>Pedidos</h2>
      <ul>
        <li>
          Los precios están en soles e incluyen IGV. El total que pagas es el que ves al confirmar.
        </li>
        <li>
          Los pedidos se aceptan dentro del horario de cada sede. Puedes programar un pedido para
          más tarde.
        </li>
        <li>El delivery llega a los distritos listados en el checkout, con la tarifa indicada.</li>
        <li>
          Si un plato se agota después de tu pedido, te contactamos para cambiarlo o devolverte lo
          pagado.
        </li>
      </ul>
      <h2>Pagos</h2>
      <ul>
        <li>
          Aceptamos efectivo al recibir y, cuando estén disponibles, Yape, Plin y tarjeta mediante
          una pasarela autorizada.
        </li>
        <li>No guardamos datos de tarjetas: los procesa directamente la pasarela de pagos.</li>
      </ul>
      <h2>Reservas</h2>
      <ul>
        <li>Te esperamos hasta 15 minutos después de la hora reservada.</li>
        <li>Puedes cancelar tu reserva con el enlace que te damos al confirmarla.</li>
      </ul>
      <h2>Reclamos</h2>
      <p>
        Puedes registrar un reclamo o queja en nuestro{" "}
        <Link href="/libro-de-reclamaciones" className="underline underline-offset-4">
          Libro de Reclamaciones virtual
        </Link>
        .
      </p>
    </LegalPage>
  );
}
