/**
 * Datos del sitio usados por el layout (F0-12).
 * Los datos de contacto y horarios reales están PENDIENTES DE LA DUEÑA (README §9):
 * mientras valgan `null`, la interfaz no los muestra. No inventar valores.
 */
import type { MenuSlug } from "@/types/catalog";

export interface BranchInfo {
  slug: "lince" | "jesus-maria";
  name: string;
  address: string | null;
  phone: string | null;
  /** Solo dígitos con código de país: 51987654321. */
  whatsapp: string | null;
  /** Enlace «Compartir» de Google Maps (maps.app.goo.gl/…): botón «Cómo llegar». */
  mapsUrl: string | null;
  /** src del iframe de «Compartir → Insertar un mapa» (google.com/maps/embed?pb=…). */
  mapsEmbedUrl: string | null;
  hours: string | null;
}

export const BRANCHES: readonly BranchInfo[] = [
  {
    slug: "lince",
    name: "Lince",
    address: null,
    phone: null,
    whatsapp: null,
    mapsUrl: null,
    mapsEmbedUrl: null,
    hours: null,
  },
  {
    slug: "jesus-maria",
    name: "Jesús María",
    address: null,
    phone: null,
    whatsapp: null,
    mapsUrl: null,
    mapsEmbedUrl: null,
    hours: null,
  },
];

export interface NavLink {
  href: string;
  label: string;
}

export const MAIN_NAV: readonly NavLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/carta/marina", label: "Cartas" },
  { href: "/reservas", label: "Reservas" },
  { href: "/nosotros", label: "Nosotros" },
];

export const MENU_LINKS: ReadonlyArray<{ slug: MenuSlug; label: string }> = [
  { slug: "marina", label: "Marina" },
  { slug: "criolla", label: "Criolla" },
  { slug: "berycafe", label: "Berycafé" },
  { slug: "piqueos", label: "Piqueos" },
  { slug: "el-bar", label: "El Bar" },
  { slug: "vegetariana", label: "Vegetariana" },
];

export const LEGAL_LINKS: readonly NavLink[] = [
  { href: "/libro-de-reclamaciones", label: "Libro de Reclamaciones" },
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/devoluciones", label: "Cambios y devoluciones" },
];

export const PAYMENT_METHODS: readonly string[] = [
  "Yape",
  "Plin",
  "Tarjeta",
  "Efectivo al recibir",
];

/** Primer WhatsApp disponible entre las sedes, o null. */
export function primaryWhatsapp(branches: readonly BranchInfo[] = BRANCHES): string | null {
  return branches.find((b) => b.whatsapp)?.whatsapp ?? null;
}

export function whatsappUrl(number: string, message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

const MAPS_EMBED_PREFIX = "https://www.google.com/maps/embed?";

/** Solo acepta el iframe oficial de Google Maps (el CSP solo permite ese origen). */
export function isGoogleMapsEmbed(url: string | null): url is string {
  return url !== null && url.startsWith(MAPS_EMBED_PREFIX);
}
