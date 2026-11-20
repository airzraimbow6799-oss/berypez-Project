import type { Metadata } from "next";

import {
  AboutHero,
  AboutPress,
  AboutRecognitions,
  AboutStory,
} from "@/components/about/AboutSections";
import { AboutTimeline } from "@/components/about/AboutTimeline";
import { GoogleReviews } from "@/components/about/GoogleReviews";
import { Branches } from "@/components/home/HomeSections";
import { Button } from "@/components/ui/Button";

// Se regenera una vez al día: los años desde la apertura cambian solos cada año.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "La historia de Berypez: Berla Carlos y Julio abrieron la cevichería en 2010. Mistura, ENBHIGA 2025 y entrevistas en RPP, Panamericana y Nativa.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStory />
      <AboutPress />
      <AboutTimeline />
      <GoogleReviews />
      <AboutRecognitions />
      <Branches />
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3 px-4 pb-12">
        <Button href="/carta/marina" size="lg">
          Ver la carta
        </Button>
        <Button href="/reservas" variant="secundario" size="lg">
          Reservar mesa
        </Button>
      </div>
    </>
  );
}
