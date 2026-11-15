import Link from "next/link";

interface LogoProps {
  tone?: "marino" | "crema";
}

/** Logotipo en texto hasta tener el archivo vectorial de la marca (README §9). */
export function Logo({ tone = "marino" }: LogoProps) {
  const color = tone === "marino" ? "text-marino" : "text-crema";
  return (
    <Link
      href="/"
      aria-label="Berypez, ir al inicio"
      className={`font-display min-h-tactil inline-flex items-center text-2xl leading-none font-semibold tracking-tight ${color}`}
    >
      Berypez
      <span aria-hidden="true" className="text-aji">
        .
      </span>
    </Link>
  );
}
