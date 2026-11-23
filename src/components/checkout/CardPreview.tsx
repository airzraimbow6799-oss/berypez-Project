import { BRAND_LABELS, type CardBrand, onlyDigits } from "@/features/payments/card";

/** Rellena con puntos lo que falta del número: «4111 ···· ···· ····». */
function masked(formatted: string, brand: CardBrand): string {
  const template = brand === "amex" ? "···· ······ ·····" : "···· ···· ···· ····";
  const chars = [...template];
  let digit = 0;
  const digits = onlyDigits(formatted);
  return chars
    .map((ch) => {
      if (ch === " ") return " ";
      const next = digits[digit];
      digit += 1;
      return next ?? ch;
    })
    .join("");
}

/**
 * Tarjeta que se va armando mientras la persona escribe, y se da vuelta al pasar al CVV.
 * Es solo una vista: nada de lo que muestra sale del navegador. Sin «reducir movimiento»
 * el giro es instantáneo.
 */
export function CardPreview({
  number,
  name,
  expiry,
  cvv,
  brand,
  isFlipped,
}: {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  brand: CardBrand;
  isFlipped: boolean;
}) {
  return (
    <div
      className="mx-auto w-full max-w-[22rem] [perspective:900px]"
      role="img"
      aria-label={`Vista previa de la tarjeta ${BRAND_LABELS[brand]}${isFlipped ? ", lado del código de seguridad" : ""}`}
    >
      <div
        className="relative aspect-[1.586] w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none"
        style={{ transform: isFlipped ? "rotateY(180deg)" : "none" }}
      >
        <div className="bg-marino text-crema [container-type:inline-size] absolute inset-0 flex flex-col justify-between overflow-hidden rounded-lg p-5 shadow-lg [backface-visibility:hidden]">
          <div className="flex items-start justify-between">
            <span className="bg-aji h-8 w-11 rounded-sm" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-wide uppercase">
              {BRAND_LABELS[brand]}
            </span>
          </div>
          {/* 7cqw: el número entero cabe en la tarjeta sea cual sea su ancho (celular o dos columnas). */}
          <p className="font-mono text-[7cqw] tracking-wider whitespace-nowrap tabular-nums">
            {masked(number, brand)}
          </p>
          <div className="flex items-end justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="text-crema/70 text-xs uppercase">Titular</p>
              <p className="truncate font-semibold uppercase">{name.trim() || "Tu nombre"}</p>
            </div>
            <div className="text-right">
              <p className="text-crema/70 text-xs uppercase">Vence</p>
              <p className="font-mono font-semibold tabular-nums">{expiry || "MM/AA"}</p>
            </div>
          </div>
        </div>

        <div className="bg-marino-800 text-crema absolute inset-0 flex [transform:rotateY(180deg)] flex-col justify-between overflow-hidden rounded-lg py-5 shadow-lg [backface-visibility:hidden]">
          <span className="bg-marino mt-2 block h-10 w-full" aria-hidden="true" />
          <div className="px-5">
            <p className="text-crema/70 text-xs uppercase">Código de seguridad</p>
            <p className="bg-crema text-marino mt-1 rounded-sm px-3 py-2 text-right font-mono font-semibold tracking-widest tabular-nums">
              {cvv ? cvv.replace(/./g, "•") : "•••"}
            </p>
          </div>
          <p className="text-crema/70 px-5 text-xs">
            Está atrás de tu tarjeta. Nunca te lo pediremos por WhatsApp ni por llamada.
          </p>
        </div>
      </div>
    </div>
  );
}
