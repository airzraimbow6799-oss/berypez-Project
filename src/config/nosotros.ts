/**
 * Contenido de «Nosotros». Cada dato tiene su fuente pública y se verificó el 20/11/2026
 * (la investigación completa está en docs/nosotros-fuentes.md). Si algo no se pudo comprobar
 * en la fuente original, no está aquí.
 */

export interface TimelineImage {
  src: string;
  alt: string;
}

export interface Milestone {
  year: number;
  title: string;
  text: string;
  source?: { label: string; href: string };
  /** Fotos que acompañan el año (platos de la carta actual o fotos propias de Berypez). */
  images?: readonly TimelineImage[];
}

export const MILESTONES: readonly Milestone[] = [
  {
    year: 2010,
    title: "Nace Berypez",
    text: "El 19 de setiembre, Berla Carlos y Julio, su compañero de vida, abren Berypez con un deseo: servir y brindar alegría.",
    source: { label: "berypez.pe", href: "https://berypez.pe/nosotros/" },
    images: [
      { src: "/catalog/ceviche-berypez.webp", alt: "Ceviche Berypez, el plato de la casa." },
      { src: "/sedes/jesus-maria.webp", alt: "Fachada de Berypez en Jesús María." },
    ],
  },
  {
    year: 2013,
    title: "Primera vez en televisión",
    text: "Berypez aparece con un sorteo en «La Tribuna de Alfredo», de Panamericana TV.",
    source: { label: "YouTube", href: "https://www.youtube.com/watch?v=uA0nZuFUJRc" },
  },
  {
    year: 2017,
    title: "En Mistura",
    text: "En los 10 años de la feria, Trome destaca la novedad de Berypez: chaufa de langostinos y cha siu.",
    source: {
      label: "Trome",
      href: "https://trome.com/actualidad/mistura-feria-platos-dias-entradas-fotos-65505/",
    },
    images: [
      {
        src: "/catalog/chaufa-de-mariscos.webp",
        alt: "Chaufa de mariscos de la carta de Berypez.",
      },
    ],
  },
  {
    year: 2019,
    title: "La ruta de Infotur",
    text: "Infotur Perú visita Lince por el cebiche norteño con tortita de choclo y el Berychaufa.",
    source: {
      label: "Infotur",
      href: "https://archivo.infoturlatam.com/index.php/noticias/gastronomia/item/7423-disfruta-del-cebiche-norteno-con-tortita-de-choclo-y-el-berychaufa-en-berypez",
    },
    images: [
      { src: "/catalog/ceviche-norteno.webp", alt: "Ceviche norteño de Berypez." },
      { src: "/catalog/berychaufa-amazonico.webp", alt: "Berychaufa amazónico." },
    ],
  },
  {
    year: 2020,
    title: "Ejemplo de atención segura",
    text: "La Presidencia de la República convoca a Berypez para su video sobre el protocolo de atención en restaurantes.",
    source: {
      label: "Andina",
      href: "https://andina.pe/agencia/noticia-presidencia-de-republica-pide-respetar-protoloco-atencion-restaurantes-806515.aspx",
    },
  },
  {
    year: 2021,
    title: "Para mamá, desde Lince",
    text: "Por el Día de la Madre, Trome recomienda los cebiches, la causa y el arroz con mariscos de Berypez.",
    source: {
      label: "Trome",
      href: "https://trome.com/actualidad/dia-de-la-madre-restaurantes-ofrecen-ricos-potajes-delivery-gastronomia-peruana-noticia/",
    },
    images: [
      { src: "/catalog/causa-acevichada.webp", alt: "Causa acevichada de Berypez." },
      { src: "/catalog/arroz-con-mariscos-2.webp", alt: "Fuente de arroz con mariscos." },
    ],
  },
  {
    year: 2023,
    title: "Festival del Cebiche",
    text: "Berypez lleva su cocina y su stand al Festival del Cebiche.",
    source: { label: "YouTube", href: "https://www.youtube.com/watch?v=nkZwGJhsk38" },
    images: [
      {
        src: "/nosotros/berla.webp",
        alt: "Berla Carlos en el stand de Berypez con el afiche del Día Nacional del Cebiche 2023.",
      },
    ],
  },
  {
    year: 2025,
    title: "Anfitriones de ENBHIGA",
    text: "En el Encuentro Bioceánico Hispanoamericano de Gastronomía, Berypez sirve el primer almuerzo a toda la delegación: 60 personas.",
    source: {
      label: "Visión Gourmet",
      href: "https://www.visiongourmet.com.ar/enbhiga-peru-2025-tres-dias-de-gastronomia-cultura-y-turismo/",
    },
    images: [
      { src: "/catalog/fuente-ceviche-mixto.webp", alt: "Fuente de ceviche mixto para compartir." },
    ],
  },
  {
    year: 2026,
    title: "Aliados del turismo gastronómico",
    text: "Alianza con la Cámara Gastronómica Turística del Perú para sumar la cocina marina a los circuitos turísticos de Lima.",
    source: {
      label: "Cámara Gastronómica",
      href: "https://www.camaragastronomicaturisticadelperu.com/socios/",
    },
    images: [
      { src: "/catalog/trio-con-causa.webp", alt: "Trío con causa de Berypez." },
      { src: "/sedes/lince.webp", alt: "Fachada de Berypez en Lince." },
    ],
  },
];

export interface PressVideo {
  id: string;
  outlet: string;
  title: string;
  date: string;
}

/** Entrevistas y notas en video (todas mencionan a Berypez en el video o su descripción). */
export const PRESS_VIDEOS: readonly PressVideo[] = [
  { id: "XCIKhFdI380", outlet: "RPP Noticias", title: "La sobremesa electoral", date: "2020-01" },
  {
    id: "YRcDDN6ZBeM",
    outlet: "RPP Noticias",
    title: "El rubro marino celebra el Día de la Madre",
    date: "2023-05",
  },
  {
    id: "xlrMIWREKe0",
    outlet: "Nativa · Mañanas Informativas",
    title: "Comida marina en temporada navideña",
    date: "2019-12",
  },
  {
    id: "6FMJcghwxyE",
    outlet: "RPP Noticias",
    title: "Platos marinos por Fiestas Patrias",
    date: "2023-07",
  },
  {
    id: "pZbz6EDnOEE",
    outlet: "RPP Noticias",
    title: "Cómo preparar una tortilla de mariscos",
    date: "2024-05",
  },
  {
    id: "nkZwGJhsk38",
    outlet: "Premium Perú TV",
    title: "Berypez en el Festival del Cebiche",
    date: "2023-07",
  },
  {
    id: "Tb2KmgYgbHg",
    outlet: "RPP Noticias",
    title: "Día del Cebiche: qué no puede faltar",
    date: "2026-06",
  },
  {
    id: "tqBrYIlWO4s",
    outlet: "La Cocina del Chef del Pueblo",
    title: "El Chef del Pueblo en Berypez",
    date: "2022-01",
  },
  {
    id: "uA0nZuFUJRc",
    outlet: "Panamericana TV",
    title: "La Tribuna de Alfredo",
    date: "2013-09",
  },
];

export interface PressQuote {
  outlet: string;
  date: string;
  quote: string;
  href: string;
}

/** Frases textuales de la prensa escrita, con enlace a la nota original. */
export const PRESS_QUOTES: readonly PressQuote[] = [
  {
    outlet: "Infotur Perú",
    date: "2019",
    quote: "Hemos querido traer los sabores del norte de nuestro Perú a la capital. — Berla Carlos",
    href: "https://archivo.infoturlatam.com/index.php/noticias/gastronomia/item/7423-disfruta-del-cebiche-norteno-con-tortita-de-choclo-y-el-berychaufa-en-berypez",
  },
  {
    outlet: "Trome",
    date: "Mayo 2021",
    quote:
      "Restaurante ‘Berypez’ ofrece cebiches, causa y arroz con mariscos, entre otros potajes para mamá.",
    href: "https://trome.com/actualidad/dia-de-la-madre-restaurantes-ofrecen-ricos-potajes-delivery-gastronomia-peruana-noticia/",
  },
  {
    outlet: "Panamericana TV",
    date: "La Tribuna de Alfredo",
    quote: "Probamos un riquísimo chinguirito y una causa acevichada en el restaurante ‘BeryPez’.",
    href: "https://panamericana.pe/tribunadealfredo/entretenimiento/199277-buscas-comer-casa-semana-ten-cuenta-opciones",
  },
];

export interface Recognition {
  title: string;
  detail: string;
  href?: string;
}

export const RECOGNITIONS: readonly Recognition[] = [
  {
    title: "Mistura 2017",
    detail: "Parte de la feria gastronómica más grande del país, en su décimo aniversario.",
    href: "https://trome.com/actualidad/mistura-feria-platos-dias-entradas-fotos-65505/",
  },
  {
    title: "Maestros del Sabor",
    detail: "Berla Carlos, participante del concurso de cocina de Cusqueña.",
    href: "https://www.cusquena.com/maestros-del-sabor/participantes/berla-carlos",
  },
  {
    title: "Sede de ENBHIGA Perú 2025",
    detail: "Una de las tres sedes en Lima del encuentro de gastronomía hispanoamericana.",
    href: "https://www.visiongourmet.com.ar/enbhiga-peru-2025-tres-dias-de-gastronomia-cultura-y-turismo/",
  },
  {
    title: "Buen Contribuyente SUNAT",
    detail: "Las dos empresas de Berypez figuran en el padrón de Buenos Contribuyentes.",
    href: "https://ww1.sunat.gob.pe/descarga/BueCont/BueCont257.html",
  },
];

/** «Mes-año» legible a partir de "2023-05". */
export function formatMonthYear(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) {
    return value;
  }
  const name = new Intl.DateTimeFormat("es-PE", { month: "long" }).format(
    new Date(year, month - 1, 1),
  );
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export interface TimelineYear {
  year: number;
  milestones: readonly Milestone[];
  videos: readonly PressVideo[];
}

/** Junta hitos y reportajes de TV por año (de más antiguo a más nuevo) para la línea de tiempo. */
export function timelineByYear(
  milestones: readonly Milestone[] = MILESTONES,
  videos: readonly PressVideo[] = PRESS_VIDEOS,
): TimelineYear[] {
  const years = new Set<number>([
    ...milestones.map((m) => m.year),
    ...videos.map((v) => Number(v.date.slice(0, 4))),
  ]);
  return [...years]
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      milestones: milestones.filter((m) => m.year === year),
      videos: videos
        .filter((v) => Number(v.date.slice(0, 4)) === year)
        .toSorted((a, b) => a.date.localeCompare(b.date)),
    }));
}

/** Los reportajes del carrusel «Lo mejor en TV», en el orden en que aparecen. */
export const FEATURED_REPORT_IDS: readonly string[] = [
  "XCIKhFdI380",
  "xlrMIWREKe0",
  "YRcDDN6ZBeM",
  "nkZwGJhsk38",
  "Tb2KmgYgbHg",
  "uA0nZuFUJRc",
  "tqBrYIlWO4s",
];

export function featuredReports(
  ids: readonly string[] = FEATURED_REPORT_IDS,
  videos: readonly PressVideo[] = PRESS_VIDEOS,
): PressVideo[] {
  return ids.flatMap((id) => videos.find((v) => v.id === id) ?? []);
}
