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
    mapsUrl: "https://maps.google.com/?cid=6654021222927840273",
    mapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7802.9342124072955!2d-77.03855320477439!3d-12.080141711354685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c863da844e09%3A0x5c57d50c38863411!2sBerypez!5e0!3m2!1ses!2spe!4v1794759577246!5m2!1ses!2spe",
    hours: null,
  },
  {
    slug: "jesus-maria",
    name: "Jesús María",
    address: null,
    phone: null,
    whatsapp: null,
    mapsUrl: "https://maps.google.com/?cid=8218705316940728127",
    mapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7803.183733912862!2d-77.04923450642085!3d-12.071577799999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c8ee869df4df%3A0x720eb4f0f1ddc73f!2sBerypez%20%7C%20Cevicheria!5e0!3m2!1ses!2spe!4v1794759603614!5m2!1ses!2spe",
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
