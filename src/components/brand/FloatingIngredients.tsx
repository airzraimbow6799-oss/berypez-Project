/*
 * Ingredientes dibujados en línea (como el fondo de mariscos) que flotan alrededor de una sección
 * con parallax ([data-flota] en motion.css). Decorativos: aria-hidden y sin eventos del mouse.
 * Sin movimiento quedan quietos en su sitio.
 */

const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Limon() {
  return (
    <svg viewBox="0 0 64 64" {...TRAZO}>
      <circle cx="32" cy="32" r="27" />
      <circle cx="32" cy="32" r="21" />
      {[0, 45, 90, 135].map((a) => (
        <line
          key={a}
          x1={32 + 20 * Math.cos((a * Math.PI) / 180)}
          y1={32 + 20 * Math.sin((a * Math.PI) / 180)}
          x2={32 - 20 * Math.cos((a * Math.PI) / 180)}
          y2={32 - 20 * Math.sin((a * Math.PI) / 180)}
        />
      ))}
    </svg>
  );
}

function Aji() {
  return (
    <svg viewBox="0 0 64 64" {...TRAZO}>
      <path d="M12 52c6-16 18-30 34-36 5-2 8 1 6 5-8 14-22 28-38 33-2 1-3 0-2-2Z" />
      <path d="M46 16c1-5 4-8 9-9" />
      <path d="M22 44c6-6 12-13 18-20" opacity="0.6" />
    </svg>
  );
}

function Concha() {
  return (
    <svg viewBox="0 0 64 64" {...TRAZO}>
      <path d="M8 40C8 22 20 10 32 10s24 12 24 30c-6 6-14 9-24 9S14 46 8 40Z" />
      <path d="M32 49V12M20 46l6-34M44 46l-6-34M13 42l13-28M51 42 38 14" />
      <path d="M26 49h12l-2 6h-8Z" />
    </svg>
  );
}

function Pez() {
  return (
    <svg viewBox="0 0 64 64" {...TRAZO}>
      <path d="M6 32c8-11 20-16 32-14 7 1 13 6 16 14-3 8-9 13-16 14-12 2-24-3-32-14Z" />
      <path d="M54 32l8-9v18Z" />
      <circle cx="18" cy="29" r="1.6" fill="currentColor" />
      <path d="M28 22c3 6 3 14 0 20" opacity="0.6" />
    </svg>
  );
}

const DIBUJOS = { limon: Limon, aji: Aji, concha: Concha, pez: Pez } as const;

export type Ingrediente = {
  tipo: keyof typeof DIBUJOS;
  /** Posición y tamaño (clases Tailwind: top-*, left-*, size-*, rotate-*, hidden md:block…). */
  className: string;
  velocidad?: "lenta" | "rapida";
  color?: "marino" | "aji";
};

export function FloatingIngredients({ items }: Readonly<{ items: readonly Ingrediente[] }>) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {items.map(({ tipo, className, velocidad = "lenta", color = "marino" }, index) => {
        const Dibujo = DIBUJOS[tipo];
        return (
          <span
            key={`${tipo}-${index}`}
            data-flota={velocidad}
            className={`absolute block ${color === "aji" ? "text-aji/70" : "text-marino/25"} ${className}`}
          >
            <Dibujo />
          </span>
        );
      })}
    </div>
  );
}
