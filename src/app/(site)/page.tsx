import type { Metadata } from "next";

import { Hero } from "@/components/home/Hero";
import { Branches, MenuAccess, ProductShelf, Story } from "@/components/home/HomeSections";
import { COMBO_SLUGS, FEATURED_PRODUCT_SLUG, HOUSE_PICKS, MENU_COVERS } from "@/config/home";
import { getMenusCached, getProductsBySlugsCached } from "@/features/catalog/data/cached";

// Portada estática que se regenera cada 10 min o al editar la carta (revalidateTag "catalog").
export const revalidate = 600;
export const metadata: Metadata = { title: "Inicio" };

export default async function HomePage() {
  const [menus, products] = await Promise.all([
    getMenusCached(),
    getProductsBySlugsCached([
      FEATURED_PRODUCT_SLUG,
      ...Object.values(MENU_COVERS),
      ...HOUSE_PICKS,
      ...COMBO_SLUGS,
    ]),
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
    </>
  );
}
