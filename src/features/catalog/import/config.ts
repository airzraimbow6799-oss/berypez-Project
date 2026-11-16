/**
 * Reglas de negocio de la importación (F0-04). Rafael valida el resultado en F0-Q4.
 * Cambiar aquí, no en el transformador.
 */
import type { Menu, MenuSlug, ProductTag } from "@/types/catalog";

export const MENUS: readonly Menu[] = [
  {
    slug: "marina",
    name: "Carta Marina",
    description: "Ceviches, arroces, fuentes y lo mejor del mar.",
    sortOrder: 1,
  },
  {
    slug: "criolla",
    name: "Carta Criolla",
    description: "Fondos, tacu tacus, pastas y sabor de casa.",
    sortOrder: 2,
  },
  {
    slug: "berycafe",
    name: "Berycafé",
    description: "Sánguches, jugos, cafés y menú para niños.",
    sortOrder: 3,
  },
  {
    slug: "piqueos",
    name: "Piqueos y entradas",
    description: "Causas, leches de tigre y para picar.",
    sortOrder: 4,
  },
  { slug: "el-bar", name: "El Bar", description: "Cócteles, cervezas y bebidas.", sortOrder: 5 },
  {
    slug: "vegetariana",
    name: "Carta Vegetariana",
    description: "Platos sin carne ni pescado.",
    sortOrder: 6,
  },
];

/** Categoría de WooCommerce → cartas donde aparece el producto. */
export const CATEGORY_TO_MENUS: Readonly<Record<string, readonly MenuSlug[]>> = {
  marino: ["marina"],
  criollo: ["criolla"],
  "los-vegetarianos": ["vegetariana"],
  ceviches: ["marina"],
  piqueos: ["piqueos"],
  causas: ["piqueos"],
  cocteles: ["el-bar"],
  "sin-alcohol": ["el-bar"],
  cervezas: ["el-bar"],
  gaseosas: ["berycafe", "el-bar"],
  sanguches: ["berycafe"],
  "jugos-naturales": ["berycafe"],
  "bebidas-calientes": ["berycafe"],
  "bebidas-frias": ["berycafe"],
  "bery-ninos": ["berycafe"],
};

/** Categorías que solo indican la carta o son residuales: no son secciones. */
export const NON_SECTION_CATEGORIES: ReadonlySet<string> = new Set([
  "marino",
  "criollo",
  "nov-24",
  "promo",
  "sin-categorizar",
]);

/** Se usan como sección solo si el producto no tiene otra. */
export const FALLBACK_SECTION_CATEGORIES: ReadonlySet<string> = new Set([
  "los-vegetarianos",
  "entradas",
]);

/** Productos publicados sin categoría (Anexo B): slug del producto → categoría. */
export const UNCATEGORIZED_PRODUCT_CATEGORY: Readonly<Record<string, string>> = {
  gaseosas: "gaseosas",
  cervezas: "cervezas",
  "bebidas-calientes": "bebidas-calientes",
};

export const CATEGORY_NAME_OVERRIDES: Readonly<Record<string, string>> = {
  "los-vegetarianos": "Vegetarianos",
  "bery-ninos": "Beryniños",
  "duos-y-trios": "Dúos y tríos",
  "duos-calientes": "Dúos calientes",
  cocteles: "Cócteles",
  sanguches: "Sánguches",
};

/**
 * Nombres de plato corregidos (por slug del producto en berypez.pe). Solo para decisiones del
 * negocio, documentadas: el resto del texto se toma tal cual del snapshot.
 */
export const PRODUCT_NAME_OVERRIDES: Readonly<Record<string, string>> = {
  // QA-002 (#24): había dos «Arroz con mariscos». Este es el de la sección Fuentes (media fuente
  // y fuente); el individual de Arroces conserva el nombre. Decidido por Axel el 2026-11-16.
  "arroz-con-mariscos-2": "Fuente de arroz con mariscos",
};

/** Orden de las secciones dentro de una carta; las demás van al final por nombre. */
export const CATEGORY_ORDER: readonly string[] = [
  "ceviches",
  "duos-y-trios",
  "duos-calientes",
  "causas",
  "piqueos",
  "entradas",
  "chicharrones",
  "jaleas",
  "pescados-fritos",
  "arroces",
  "fuentes",
  "sudados",
  "parihuelas",
  "chupes",
  "fondos",
  "tacu-tacus",
  "platos-nortenos",
  "pastas",
  "los-vegetarianos",
  "sanguches",
  "bery-ninos",
  "jugos-naturales",
  "bebidas-calientes",
  "bebidas-frias",
  "gaseosas",
  "cocteles",
  "sin-alcohol",
  "cervezas",
];

/** Etiquetas derivadas de la categoría. El resto (picante, favorito…) lo carga el personal. */
export const CATEGORY_TAGS: Readonly<Record<string, readonly ProductTag[]>> = {
  "los-vegetarianos": ["vegetariano"],
  "bery-ninos": ["ninos"],
  fuentes: ["compartir"],
};

/** Rótulos claros para los atributos (Anexo B: “Hecho de”, “Guarnición 01”…). */
export const ATTRIBUTE_LABELS: Readonly<Record<string, string>> = {
  Tamaño: "Elige el tamaño",
  Proteína: "Elige la proteína",
  "Base de": "Elige la fruta",
  "Guarnición 01": "Elige tu primer acompañamiento",
  "Guarnición 02": "Elige tu segundo acompañamiento",
  "Opción 1": "Primera capa de tu causa",
  "Opción 2": "Segunda capa de tu causa",
  "Opción 3": "Tercera capa de tu causa",
  "Marca gaseosa": "Elige la bebida",
  "Marca cerveza": "Elige la cerveza",
  Cerveza: "Elige la cerveza",
  "Bebida caliente": "Elige la bebida",
  Bebida: "Elige la bebida",
  Agua: "¿Con gas o sin gas?",
  Tipo: "Elige el tipo",
  De: "Elige una opción",
  "Hecho de": "Elige una opción",
};

/** “De” y “Hecho de” significan cosas distintas según la sección. */
export const ATTRIBUTE_LABELS_BY_CATEGORY: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  parihuelas: { "Hecho de": "Elige tu pescado" },
  sudados: { De: "Elige tu pescado" },
  chupes: { "Hecho de": "Elige tu chupe" },
  causas: { De: "Elige el relleno" },
  jaleas: { De: "Elige tu jalea" },
  chicharrones: { De: "Elige tu chicharrón" },
  cocteles: { "Hecho de": "Elige el sabor" },
};

export const DEFAULT_ATTRIBUTE_LABEL = "Elige una opción";
