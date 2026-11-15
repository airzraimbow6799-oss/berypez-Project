import { ComplaintForm } from "@/components/legal/ComplaintForm";
import { COMPANY, COMPLAINT_RESPONSE_DAYS } from "@/config/legal";

export const metadata = { title: "Libro de Reclamaciones" };

export default function ComplaintsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-16">
      <h1 className="text-4xl font-semibold">Libro de Reclamaciones</h1>
      <p className="text-tinta-suave mt-2">
        Conforme al Código de Protección y Defensa del Consumidor, este establecimiento cuenta con
        un Libro de Reclamaciones a tu disposición. Te responderemos en un plazo de{" "}
        {COMPLAINT_RESPONSE_DAYS}.
      </p>
      <dl className="border-borde bg-superficie mt-4 grid gap-1 rounded-md border p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-tinta-suave">Proveedor</dt>
          <dd className="font-semibold">{COMPANY.legalName}</dd>
        </div>
        <div>
          <dt className="text-tinta-suave">RUC</dt>
          <dd className="font-semibold">{COMPANY.ruc}</dd>
        </div>
        <div>
          <dt className="text-tinta-suave">Domicilio</dt>
          <dd className="font-semibold">{COMPANY.address}</dd>
        </div>
      </dl>
      <ComplaintForm />
      <p className="text-tinta-suave mt-6 text-sm">
        <strong>Reclamo:</strong> disconformidad con los productos o servicios.{" "}
        <strong>Queja:</strong> disconformidad no relacionada con ellos, o malestar por la atención.
      </p>
    </div>
  );
}
