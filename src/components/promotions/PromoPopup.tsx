"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { CONSENT_EVENT, readConsent } from "@/features/consent/consent";
import { POPUP_MAX_SLIDES } from "@/features/promotions/links";
import type { Product } from "@/types/catalog";

import { useDemoWebPromos } from "./useDemoWebPromos";

// El carrusel (y sus fotos) se descarga solo cuando de verdad se va a mostrar.
const PromoCarousel = dynamic(() => import("./PromoCarousel").then((m) => m.PromoCarousel), {
  ssr: false,
});

/** Las pruebas E2E la ponen para que la ventana no tape lo que prueban (y QA si lo necesita). */
export const OPT_OUT_COOKIE = "berypez_sin_promo";
const DELAY_MS = 1200;

/** Ya se decidió en este documento: volver a Inicio navegando dentro del sitio no la repite. */
let decidedInThisDocument = false;

/** Solo para pruebas: simula una carga nueva de la página. */
export function resetPromoPopupForTests() {
  decidedInThisDocument = false;
}

/**
 * Regla del cliente: sale cada vez que la página se CARGA o RECARGA estando en Inicio.
 * No sale si se llega a Inicio navegando desde otra sección, ni al recargar otra página.
 */
export function shouldShowPromoPopup(input: {
  documentUrl: string | undefined;
  pathname: string;
  cookies: string;
}): boolean {
  if (input.pathname !== "/") return false;
  if (!input.documentUrl || new URL(input.documentUrl).pathname !== "/") return false;
  return !input.cookies.split(/;\s*/).includes(`${OPT_OUT_COOKIE}=1`);
}

function documentUrl(): string | undefined {
  const entry = performance.getEntriesByType("navigation")[0];
  return entry?.name ?? undefined;
}

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Espera a que la página termine de cargar (PageLoadedFlag) y a que se elija en el aviso de cookies. */
function whenReady(onReady: () => void): () => void {
  const html = document.documentElement;
  let timer: number | undefined;
  const check = () => {
    if (html.dataset.cargado !== "true" || readConsent(storage()) === null) return;
    cleanup();
    timer = window.setTimeout(onReady, DELAY_MS);
  };
  const observer = new MutationObserver(check);
  const cleanup = () => {
    observer.disconnect();
    window.removeEventListener(CONSENT_EVENT, check);
  };
  observer.observe(html, { attributes: true, attributeFilter: ["data-cargado"] });
  window.addEventListener(CONSENT_EVENT, check);
  check();
  return () => {
    cleanup();
    window.clearTimeout(timer);
  };
}

/** Ventana emergente de promociones de Inicio (carrusel si hay varias, la más relevante primero). */
export function PromoPopup({
  products: realProducts,
  demo = false,
}: {
  products: Product[];
  /** Modo demostración: sin promociones reales, muestra las del panel de demostración. */
  demo?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const demoPromos = useDemoWebPromos(demo && realProducts.length === 0);
  const products = realProducts.length > 0 ? realProducts : (demoPromos?.popup ?? []);

  useEffect(() => {
    if (decidedInThisDocument || products.length === 0) return;
    const show = shouldShowPromoPopup({
      documentUrl: documentUrl(),
      pathname: window.location.pathname,
      cookies: document.cookie,
    });
    if (!show) {
      decidedInThisDocument = true;
      return;
    }
    const stop = whenReady(() => {
      decidedInThisDocument = true;
      setIsOpen(true);
    });
    return () => {
      stop();
      // Se fue de Inicio antes de que saliera: al volver navegando ya no corresponde.
      // (El doble montaje de React en desarrollo no cambia la ruta, así que no cuenta.)
      if (window.location.pathname !== "/") decidedInThisDocument = true;
    };
  }, [products.length]);

  if (!isOpen) return null;
  return (
    <PromoCarousel
      products={products.slice(0, POPUP_MAX_SLIDES)}
      onClose={() => setIsOpen(false)}
    />
  );
}
