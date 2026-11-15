import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";

interface LogoProps {
  tone?: "marino" | "crema";
}

export function Logo({ tone = "marino" }: LogoProps) {
  const color = tone === "marino" ? "text-marino" : "text-crema";
  return (
    <Link
      href="/"
      aria-label="Berypez, ir al inicio"
      className={`min-h-tactil inline-flex items-center ${color}`}
    >
      <BrandLogo className="h-8 w-auto sm:h-9" />
    </Link>
  );
}
