"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  type Consent,
  readConsent,
  shouldLoadAnalytics,
  writeConsent,
} from "@/features/consent/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * F4-08 · Aviso de cookies. Ambas opciones con el mismo peso visual. GA4 (F5-05) solo se
 * carga si la persona acepta y hay un ID configurado (NEXT_PUBLIC_GA_ID).
 */
export function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [isReady, setIsReady] = useState(false);
  const avisoRef = useRef<HTMLElement>(null);
  // QA-007: alto del aviso para reservar ese espacio al final de la página (ver más abajo).
  const [altoAviso, setAltoAviso] = useState(0);

  useEffect(() => {
    setConsent(readConsent(storage()));
    setIsReady(true);
  }, []);

  const isVisible = isReady && consent === null;

  useEffect(() => {
    const aviso = avisoRef.current;
    if (!isVisible || !aviso) {
      setAltoAviso(0);
      return;
    }
    const medir = () => setAltoAviso(aviso.getBoundingClientRect().height);
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(aviso);
    return () => observer.disconnect();
  }, [isVisible]);

  const choose = (value: Consent) => {
    writeConsent(storage(), value);
    setConsent(value);
  };

  return (
    <>
      {shouldLoadAnalytics(consent, GA_ID) ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      ) : null}

      {isVisible ? (
        <>
          {/* Espacio al final de la página del alto del aviso: así el pie (enlaces legales) se
              puede desplazar por encima del aviso fijo en vez de quedar tapado (QA-007). */}
          <div aria-hidden="true" className="bg-marino" style={{ height: altoAviso + 16 }} />
          <section
            ref={avisoRef}
            aria-labelledby="cookies-titulo"
            className="border-borde bg-superficie fixed inset-x-3 bottom-20 z-40 mx-auto max-w-xl rounded-md border p-3 shadow-lg sm:p-4 lg:bottom-4"
          >
            {/* En celular el título solo lo leen los lectores de pantalla: el aviso ocupa menos y
                no tapa los botones de la portada. */}
            <h2
              id="cookies-titulo"
              className="sr-only font-sans text-base font-semibold sm:not-sr-only"
            >
              Cookies
            </h2>
            <p className="text-tinta-suave text-sm sm:mt-1">
              Usamos cookies necesarias para tu carrito y, con tu permiso, de analítica para mejorar
              la web.{" "}
              <Link href="/privacidad" prefetch={false} className="underline underline-offset-4">
                Más información sobre cookies
              </Link>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                variant="secundario"
                className="whitespace-nowrap max-sm:px-3"
                onClick={() => choose("rejected")}
              >
                Solo necesarias
              </Button>
              <Button
                variant="secundario"
                className="whitespace-nowrap max-sm:px-3"
                onClick={() => choose("accepted")}
              >
                Aceptar
              </Button>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
