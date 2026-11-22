import type { PanelReservation } from "@/components/panel/ReservationsBoard";
import type { Dish } from "@/features/carta/schema";
import type { PanelOrder } from "@/features/orders/panel";
import type { ReservationSource } from "@/features/reservations/staff-form";
import type { Member } from "@/features/staff/members";

/**
 * Datos de ejemplo del modo demostración. Los nombres de clientes, teléfonos y precios son
 * inventados para mostrar el panel: no son datos reales del restaurante.
 */

export type DemoData = {
  dishes: Dish[];
  orders: PanelOrder[];
  reservations: PanelReservation[];
  staff: Member[];
  /** Ventas de los 6 días anteriores a hoy, en céntimos (de más antiguo a más reciente). */
  salesHistoryCents: number[];
};

const MINUTE = 60_000;

type DishSeed = Omit<
  Dish,
  "id" | "image" | "tags" | "isAvailable" | "priceGroup" | "choiceGroups"
> &
  Partial<Pick<Dish, "tags" | "isAvailable" | "choiceGroups">> & {
    slug: string;
    /** Apartado con precio: [título, [opción, céntimos]...]. */
    prices?: [string, Array<[string, number]>];
  };

/** Platos reales de la carta (nombre, foto, precio y apartados), para que el demo se parezca a la web. */
const DISHES: DishSeed[] = [
  {
    slug: "ceviche-berypez",
    name: "Ceviche Berypez",
    menus: ["marina"],
    section: "Ceviches",
    priceCents: 4800,
    description: "Ceviche mixto, champiñones, crema de ají amarillo, cebolla en pluma.",
    tags: ["favorito"],
  },
  {
    slug: "ceviche-mixto",
    name: "Ceviche mixto",
    menus: ["marina"],
    section: "Ceviches",
    priceCents: 4500,
    description: "Pescado, caracol, pulpo, langostino y conchas de abanico.",
  },
  {
    slug: "ceviche-de-champinones",
    name: "Ceviche de champiñones",
    menus: ["marina", "vegetariana"],
    section: "Ceviches",
    priceCents: 3500,
    description: "Ceviche de champiñones.",
    tags: ["vegetariano"],
  },
  {
    slug: "sudados",
    name: "Sudados",
    menus: ["marina"],
    section: "Sudados",
    priceCents: 4000,
    description:
      "Filete de pescado 200 GR o entero de 550 GR, chicha de jora, tomate, cebolla. Yuca perfumada con culantro, acompañado de arroz.",
    prices: [
      "Elige tu pescado",
      [
        ["Pesca del día", 4000],
        ["Cabrilla", 4800],
        ["Tramboyo", 5000],
        ["Chita", 6800],
      ],
    ],
    choiceGroups: [
      { label: "Elige el tipo", options: ["Filete de pescado 200 GR", "Pescado entero de 550 GR"] },
    ],
  },
  {
    slug: "chicharrones",
    name: "Chicharrones",
    menus: ["marina"],
    section: "Chicharrones",
    priceCents: 4000,
    description: "Acompañado de yuca frita y salsa tártara.",
    prices: [
      "Elige tu chicharrón",
      [
        ["Pesca del día", 4000],
        ["Mixto", 4200],
        ["Calamar", 4800],
      ],
    ],
  },
  {
    slug: "parihuelas",
    name: "Parihuelas",
    menus: ["marina"],
    section: "Parihuelas",
    priceCents: 4200,
    description: "Concentrado de pescado (filete o entero), mariscos y pulpa de cangrejo.",
    prices: [
      "Elige tu pescado",
      [
        ["Pesca del día (filete)", 4200],
        ["Cabrilla", 5800],
        ["Tramboyo", 6000],
        ["Chita", 7800],
      ],
    ],
    isAvailable: false,
  },
  {
    slug: "jaleas",
    name: "Jaleas",
    menus: ["marina"],
    section: "Jaleas",
    priceCents: 4800,
    description: "Acompañado de yuca frita, filete de pescado, salsa criolla y salsa tártara.",
    prices: [
      "Elige tu jalea",
      [
        ["Calamar", 4800],
        ["Mixta", 4800],
        ["Pescado", 4800],
      ],
    ],
    tags: ["compartir"],
  },
  {
    slug: "arroz-con-mariscos",
    name: "Arroz con mariscos",
    menus: ["marina"],
    section: "Arroces",
    priceCents: 4200,
    description:
      "Arroz con mixtura de mariscos, salsa madre y queso parmesano perfumado con culantro.",
  },
  {
    slug: "chaufa-de-mariscos",
    name: "Chaufa de mariscos",
    menus: ["marina", "criolla"],
    section: "Fuentes",
    priceCents: 8000,
    description: "Chaufa de mariscos.",
    tags: ["compartir"],
    prices: [
      "Elige el tamaño",
      [
        ["1/2 fuente (2 porc)", 8000],
        ["1 fuente (4 porc)", 15500],
      ],
    ],
  },
  {
    slug: "causa-acevichada",
    name: "Causa acevichada",
    menus: ["piqueos"],
    section: "Causas",
    priceCents: 4500,
    description: "Causa de pulpa de cangrejo + ceviche al rojo vivo.",
  },
  {
    slug: "leche-de-tigre",
    name: "Leche de tigre 12 oz",
    menus: ["piqueos"],
    section: "Piqueos",
    priceCents: 2000,
    description: "Delicioso concentrado de ceviche.",
    tags: ["picante"],
  },
  {
    slug: "tequenos-de-langostinos-6-unid",
    name: "Tequeños de langostinos (6 unid)",
    menus: ["piqueos"],
    section: "Piqueos",
    priceCents: 2200,
    description: "Acompañado con salsa de la casa.",
    isAvailable: false,
  },
  {
    slug: "lomo-saltado",
    name: "Lomo saltado",
    menus: ["criolla"],
    section: "Fondos",
    priceCents: 4800,
    description:
      "Dados de lomo fino salteado al wok, cebolla, tomate en gajos, arroz y papa frita.",
  },
  {
    slug: "pisco-sour",
    name: "Pisco Sour",
    menus: ["el-bar"],
    section: "Cócteles",
    priceCents: 2500,
    description: "Tradicional o de maracuyá.",
    prices: [
      "Elige el sabor",
      [
        ["Tradicional", 2500],
        ["Maracuyá", 2500],
      ],
    ],
  },
];

export function seedDishes(): Dish[] {
  return DISHES.map(({ slug, prices, ...rest }, index) => ({
    ...rest,
    id: index + 1,
    image: { url: `/catalog/${slug}.webp`, alt: rest.name },
    tags: rest.tags ?? [],
    isAvailable: rest.isAvailable ?? true,
    priceGroup: prices
      ? {
          label: prices[0],
          options: prices[1].map(([label, priceCents]) => ({ label, priceCents })),
        }
      : null,
    choiceGroups: rest.choiceGroups ?? [],
  }));
}

type OrderSeed = Omit<PanelOrder, "createdAt"> & { minutesAgo: number };

const ORDERS: OrderSeed[] = [
  {
    id: 1041,
    minutesAgo: 3,
    status: "received",
    modality: "pickup",
    customerName: "Lucía Paredes",
    customerPhone: "944182736",
    district: null,
    address: null,
    scheduledFor: null,
    notes: null,
    totalCents: 8400,
    paymentMethod: "cash",
    branchName: "Lince",
    items: [
      {
        name: "Ceviche clásico",
        variantLabel: null,
        quantity: 1,
        notes: "Sin cebolla",
        choices: [],
      },
      { name: "Chicharrón de pescado", variantLabel: null, quantity: 1, notes: null, choices: [] },
      { name: "Chicha morada (jarra)", variantLabel: null, quantity: 1, notes: null, choices: [] },
    ],
  },
  {
    id: 1040,
    minutesAgo: 12,
    status: "in_kitchen",
    modality: "delivery",
    customerName: "Marco Quispe",
    customerPhone: "987316640",
    district: "Jesús María",
    address: "Av. Brasil 1820, depto 502",
    scheduledFor: null,
    notes: "Tocar el timbre dos veces",
    totalCents: 13100,
    paymentMethod: "cash",
    branchName: "Jesús María",
    items: [
      { name: "Ceviche mixto", variantLabel: null, quantity: 2, notes: null, choices: [] },
      { name: "Arroz con mariscos", variantLabel: null, quantity: 1, notes: null, choices: [] },
    ],
  },
  {
    id: 1039,
    minutesAgo: 26,
    status: "ready_for_pickup",
    modality: "pickup",
    customerName: "Carla Huamán",
    customerPhone: "951227804",
    district: null,
    address: null,
    scheduledFor: null,
    notes: null,
    totalCents: 4200,
    paymentMethod: "cash",
    branchName: "Lince",
    items: [
      {
        name: "Parihuelas",
        variantLabel: "Cabrilla",
        quantity: 1,
        notes: null,
        choices: ["Con ají aparte"],
      },
    ],
  },
  {
    id: 1038,
    minutesAgo: 38,
    status: "on_the_way",
    modality: "delivery",
    customerName: "Diego Salazar",
    customerPhone: "962470913",
    district: "Lince",
    address: "Jr. Manuel Candamo 455",
    scheduledFor: null,
    notes: null,
    totalCents: 6800,
    paymentMethod: "cash",
    branchName: "Lince",
    items: [
      { name: "Causa de verduras", variantLabel: null, quantity: 1, notes: null, choices: [] },
      { name: "Milanesa de pescado", variantLabel: null, quantity: 1, notes: null, choices: [] },
    ],
  },
  {
    id: 1037,
    minutesAgo: 95,
    status: "delivered",
    modality: "pickup",
    customerName: "Rosa Tello",
    customerPhone: "938552071",
    district: null,
    address: null,
    scheduledFor: null,
    notes: null,
    totalCents: 3800,
    paymentMethod: "cash",
    branchName: "Jesús María",
    items: [{ name: "Ceviche clásico", variantLabel: null, quantity: 1, notes: null, choices: [] }],
  },
  {
    id: 1036,
    minutesAgo: 140,
    status: "cancelled",
    modality: "delivery",
    customerName: "Andrés Vilca",
    customerPhone: "977018352",
    district: "Pueblo Libre",
    address: "Av. Bolívar 1290",
    scheduledFor: null,
    notes: null,
    totalCents: 5400,
    paymentMethod: "cash",
    branchName: "Jesús María",
    items: [
      { name: "Chaufa de mariscos", variantLabel: null, quantity: 1, notes: null, choices: [] },
    ],
  },
];

export function seedOrders(now: number): PanelOrder[] {
  return ORDERS.map(({ minutesAgo, ...order }) => ({
    ...order,
    createdAt: new Date(now - minutesAgo * MINUTE).toISOString(),
  }));
}

type ReservationSeed = Omit<PanelReservation, "startsAt"> & { inMinutes: number };

const RESERVATIONS: ReservationSeed[] = [
  {
    id: 311,
    inMinutes: -50,
    partySize: 4,
    area: "interior",
    occasion: null,
    name: "Familia Ccori",
    phone: "945220118",
    status: "arrived",
    branch: "Lince",
  },
  {
    id: 312,
    inMinutes: 75,
    partySize: 2,
    area: "terraza",
    occasion: "Aniversario",
    name: "Valeria Núñez",
    phone: "991736402",
    status: "confirmed",
    branch: "Lince",
  },
  {
    id: 313,
    inMinutes: 150,
    partySize: 8,
    area: "interior",
    occasion: "Cumpleaños",
    name: "Jorge Cárdenas",
    phone: "953401277",
    status: "confirmed",
    branch: "Jesús María",
  },
  {
    id: 314,
    inMinutes: 60 * 24 + 30,
    partySize: 6,
    area: null,
    occasion: null,
    name: "Mónica Ríos",
    phone: "968114530",
    status: "confirmed",
    branch: "Lince",
  },
  {
    id: 315,
    inMinutes: 60 * 26,
    partySize: 3,
    area: "terraza",
    occasion: null,
    name: "Iván Quinto",
    phone: "934660291",
    status: "cancelled",
    branch: "Jesús María",
  },
];

const SOURCES: Record<number, ReservationSource> = {
  311: "phone",
  312: "web",
  313: "whatsapp",
  314: "web",
  315: "web",
};

export function seedReservations(now: number): PanelReservation[] {
  return RESERVATIONS.map(({ inMinutes, ...reservation }) => ({
    ...reservation,
    source: SOURCES[reservation.id] ?? "web",
    notes: reservation.occasion,
    startsAt: new Date(
      Math.round((now + inMinutes * MINUTE) / (30 * MINUTE)) * 30 * MINUTE,
    ).toISOString(),
  }));
}

export function seedStaff(): Member[] {
  const person = (
    id: number,
    name: string,
    role: Member["role"],
    branch: Member["branch"],
    extra: Partial<Pick<Member, "isActive" | "isPending" | "email">> = {},
  ): Member => ({
    id,
    name,
    role,
    branch,
    email: `${name.split(" ")[0]?.toLowerCase()}@demo.berypez.pe`,
    isActive: true,
    isPending: false,
    ...extra,
  });
  return [
    person(1, "Marta Rojas", "admin", null, { email: "admin@demo.berypez.pe" }),
    person(2, "Luis Paredes", "salon", "Lince"),
    person(3, "Camila Torres", "salon", "Lince"),
    person(4, "Jorge Mamani", "salon", "Jesús María"),
    person(5, "Ana Vilca", "salon", "Jesús María", { isActive: false, isPending: true }),
  ];
}

/** Ventas de ejemplo de los 6 días anteriores (de S/ 874 a S/ 1,568). */
export const SALES_HISTORY_CENTS = [112000, 98400, 134600, 87400, 156800, 143300];

export function createDemoData(now: number): DemoData {
  return {
    dishes: seedDishes(),
    orders: seedOrders(now),
    reservations: seedReservations(now),
    staff: seedStaff(),
    salesHistoryCents: SALES_HISTORY_CENTS,
  };
}
