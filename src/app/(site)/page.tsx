import type { Metadata } from "next";

import { Hero } from "@/components/home/Hero";
import { Branches, MenuAccess, ProductShelf, Story } from "@/components/home/HomeSections";
import { COMBO_SLUGS, FEATURED_PRODUCT_SLUG, HOUSE_PICKS, MENU_COVERS } from "@/config/home";
import { PromoPopup } from "@/components/promotions/PromoPopup";
import {
  getMenusCached,
  getProductsBySlugsCached,
  getPromotedProductsCached,
} from "@/features/catalog/data/cached";
import { POPUP_MAX_SLIDES } from "@/features/promotions/links";

// Portada estática que se regenera cada 10 min o al editar la carta (revalidateTag "catalog").
export const revalidate = 600;
export const metadata: Metadata = {
  // Título completo (sin la plantilla «%s | Berypez»): es lo que Google muestra al buscar.
  title: { absolute: "Berypez · Cevichería en Lince y Jesús María" },
  description:
    "Ceviches, arroz con mariscos, chicharrón y parihuela desde 2010. Pide delivery o recojo en Lince y Jesús María, o reserva tu mesa en línea.",
};

export default async function HomePage() {
  const [menus, products, promoted] = await Promise.all([
    getMenusCached(),
    getProductsBySlugsCached([
      FEATURED_PRODUCT_SLUG,
      ...Object.values(MENU_COVERS),
      ...HOUSE_PICKS,
      ...COMBO_SLUGS,
    ]),
    getPromotedProductsCached(),
  ]);

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const pick = (slugs: readonly string[]) => slugs.flatMap((slug) => bySlug.get(slug) ?? []);
  const covers = new Map(
    Object.entries(MENU_COVERS).flatMap(([menu, slug]) => {
      const product = bySlug.get(slug);
      return product ? [[menu, product] as const] : [];
    }),
  );

  return (
    <>
      <Hero featured={bySlug.get(FEATURED_PRODUCT_SLUG) ?? null} />
      <MenuAccess menus={menus} covers={covers} />
      <ProductShelf
        id="recomendados"
        title="Recomendados de la casa"
        intro="Los platos que la cocina prepara con más orgullo."
        products={pick(HOUSE_PICKS)}
        menuSlug="marina"
      />
      <ProductShelf
        id="para-compartir"
        title="Dúos y tríos para compartir"
        intro="¿No te decides? Pide dos o tres sabores en un solo plato."
        products={pick(COMBO_SLUGS)}
        menuSlug="marina"
      />
      <Story />
      <Branches />
      <PromoPopup products={promoted.slice(0, POPUP_MAX_SLIDES)} />
    </>
  );
}
