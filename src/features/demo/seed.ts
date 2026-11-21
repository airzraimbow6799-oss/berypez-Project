import type { PanelReservation } from "@/components/panel/ReservationsBoard";
import type { Dish } from "@/features/carta/schema";
import type { PanelOrder } from "@/features/orders/panel";

/**
 * Datos de ejemplo del modo demostración. Los nombres de clientes, teléfonos y precios son
 * inventados para mostrar el panel: no son datos reales del restaurante.
 */

export type DemoData = {
  dishes: Dish[];
  orders: PanelOrder[];
  reservations: PanelReservation[];
};

const MINUTE = 60_000;

const dish = (
  id: number,
  name: string,
  category: Dish["category"],
  priceCents: number,
  description: string,
  extra: Partial<Pick<Dish, "stockQty" | "isAvailable">> = {},
): Dish => ({
  id,
  name,
  category,
  priceCents,
  description,
  stockQty: null,
  isAvailable: true,
  ...extra,
});

export function seedDishes(): Dish[] {
  return [
    dish(1, "Ceviche clásico", "Ceviches", 3800, "Pescado del día, limón, ají limo y camote."),
    dish(2, "Ceviche mixto", "Ceviches", 4600, "Pescado, pulpo, calamar y langostinos."),
    dish(3, "Ceviche carretillero", "Ceviches", 4400, "Con chicharrón de pescado encima."),
    dish(
      4,
      "Leche de tigre",
      "Entradas",
      1800,
      "El jugo del ceviche en vaso, con trozos de pescado.",
    ),
    dish(5, "Causa de verduras", "Entradas", 2200, "Papa amarilla, palta y verduras salteadas."),
    dish(6, "Tiradito al ají amarillo", "Entradas", 3600, "Láminas de pescado con crema de ají.", {
      isAvailable: false,
    }),
    dish(
      7,
      "Parihuelas",
      "Parihuelas",
      4200,
      "Concentrado de pescado, mariscos y pulpa de cangrejo.",
      {
        stockQty: 8,
      },
    ),
    dish(8, "Arroz con mariscos", "Fondos", 4400, "Arroz al ají panca con mariscos mixtos."),
    dish(9, "Chaufa de mariscos", "Fondos", 4200, "Arroz frito al wok con mariscos.", {
      stockQty: 3,
    }),
    dish(10, "Milanesa de pescado", "Fondos", 3200, "Filete apanado con ensalada y papas."),
    dish(
      11,
      "Jalea mixta",
      "Piqueos",
      5800,
      "Pescado y mariscos fritos con yuca y salsa criolla.",
      {
        stockQty: 0,
        isAvailable: false,
      },
    ),
    dish(12, "Chicharrón de pescado", "Piqueos", 3600, "Trozos de pescado fritos con tartara."),
    dish(13, "Chicha morada (jarra)", "Bebidas", 1600, "Jarra de un litro."),
    dish(14, "Limonada frozen", "Bebidas", 1200, "Vaso grande."),
  ];
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

export function seedReservations(now: number): PanelReservation[] {
  return RESERVATIONS.map(({ inMinutes, ...reservation }) => ({
    ...reservation,
    startsAt: new Date(now + inMinutes * MINUTE).toISOString(),
  }));
}

export function createDemoData(now: number): DemoData {
  return { dishes: seedDishes(), orders: seedOrders(now), reservations: seedReservations(now) };
}
