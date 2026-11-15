import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY } from "@/config/legal";

export const metadata = { title: "Privacidad" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        En cumplimiento de la Ley N.º 29733, Ley de Protección de Datos Personales, y su reglamento,
        te contamos qué datos usamos y para qué.
      </p>
      <h2>Responsable</h2>
      <p>
        {COMPANY.legalName} ({COMPANY.ruc}), con domicilio en {COMPANY.address}. Contacto:{" "}
        {COMPANY.email}.
      </p>
      <h2>Qué datos usamos</h2>
      <ul>
        <li>Pedidos: nombre, celular, correo (opcional) y dirección de entrega.</li>
        <li>Reservas: nombre, celular, correo (opcional), fecha, sede y número de personas.</li>
        <li>Libro de Reclamaciones: los datos que exige la norma de protección al consumidor.</li>
      </ul>
      <h2>Para qué</h2>
      <ul>
        <li>Preparar, entregar y darte seguimiento a tu pedido o reserva.</li>
        <li>Responder tus consultas y reclamos.</li>
        <li>Solo con tu consentimiento: medir el uso de la web para mejorarla.</li>
      </ul>
      <h2>Cuánto tiempo</h2>
      <p>Mientras sean necesarios para esos fines y por los plazos que exige la ley.</p>
      <h2>Con quién</h2>
      <p>
        Con proveedores que nos ayudan a operar la web (alojamiento, base de datos, pasarela de
        pagos y envío de correos), bajo obligaciones de confidencialidad. No vendemos tus datos.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiendo a{" "}
        {COMPANY.email}. Si no te respondemos, puedes acudir a la Autoridad Nacional de Protección
        de Datos Personales.
      </p>
      <h2>Cookies</h2>
      <p>
        Usamos cookies necesarias para que la web funcione (carrito y sesión). Las de analítica solo
        se activan si las aceptas en el aviso de cookies.
      </p>
    </LegalPage>
  );
}
