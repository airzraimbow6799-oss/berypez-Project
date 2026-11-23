import { Button } from "@/components/ui/Button";
import { type PaymentMethodId, METHOD_LABELS } from "@/features/payments/simulate";
import { formatPrice } from "@/lib/format";

/**
 * Pantalla de «pago aprobado» de la demostración. Muestra lo que vería el cliente y deja claro
 * que fue una simulación: no se cobró nada ni se creó un pedido.
 */
export function PaymentApproved({
  method,
  reference,
  totalCents,
  onReset,
}: {
  method: PaymentMethodId;
  reference: string;
  totalCents: number;
  onReset: () => void;
}) {
  return (
    <section
      aria-labelledby="pago-aprobado"
      aria-live="polite"
      className="border-borde bg-superficie mx-auto mt-6 max-w-xl rounded-lg border p-8 text-center shadow-md"
    >
      <svg
        viewBox="0 0 52 52"
        className="pago-aprobado mx-auto size-20"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className="pago-aprobado-circulo"
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="pago-aprobado-check"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 27l8 8 14-16"
        />
      </svg>
      <h2 id="pago-aprobado" className="mt-4 text-3xl font-semibold">
        ¡Pago aprobado!
      </h2>
      <p className="text-tinta-suave mt-2">
        Tu pedido pasaría a cocina al instante y verías su seguimiento paso a paso.
      </p>
      <dl className="bg-crema-200 mx-auto mt-5 grid max-w-sm grid-cols-2 gap-y-2 rounded-md p-4 text-left text-sm">
        <dt className="text-tinta-suave">Medio de pago</dt>
        <dd className="text-right font-semibold">{METHOD_LABELS[method]}</dd>
        <dt className="text-tinta-suave">Total</dt>
        <dd className="text-right font-semibold tabular-nums">{formatPrice(totalCents)}</dd>
        <dt className="text-tinta-suave">Referencia</dt>
        <dd className="text-right font-mono font-semibold">{reference}</dd>
      </dl>
      <p className="bg-aji-100 mt-5 rounded-md px-4 py-3 text-sm">
        <strong>Simulación:</strong> no se cobró nada ni se creó un pedido real.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button href="/carta/marina">Volver a la carta</Button>
        <Button variant="secundario" onClick={onReset}>
          Probar otro medio de pago
        </Button>
      </div>
    </section>
  );
}
