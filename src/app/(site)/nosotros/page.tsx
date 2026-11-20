import type { Metadata } from "next";

import { Branches, Story } from "@/components/home/HomeSections";
import { Button } from "@/components/ui/Button";

// Se regenera una vez al día: los años desde la apertura cambian solos cada año.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Berypez: cevichería de barrio en Lince y Jesús María desde 2010.",
};

export default function AboutPage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-4">
        <h1 className="text-4xl font-semibold">Nosotros</h1>
      </div>
      <Story />
      <Branches />
      <div className="mx-auto flex max-w-6xl justify-center px-4 pb-8">
        <Button href="/carta/marina" size="lg">
          Ver la carta
        </Button>
      </div>
    </>
  );
}
