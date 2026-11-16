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
            className="border-borde bg-superficie fixed inset-x-3 bottom-20 z-40 mx-auto max-w-xl rounded-md border p-4 shadow-lg lg:bottom-4"
          >
            <h2 id="cookies-titulo" className="font-sans text-base font-semibold">
              Cookies
            </h2>
            <p className="text-tinta-suave mt-1 text-sm">
              Usamos cookies necesarias para que tu carrito funcione. Con tu permiso, también usamos
              cookies de analítica para mejorar la web.{" "}
              <Link href="/privacidad" className="underline underline-offset-4">
                Más información sobre cookies
              </Link>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secundario" onClick={() => choose("rejected")}>
                Solo necesarias
              </Button>
              <Button variant="secundario" onClick={() => choose("accepted")}>
                Aceptar
              </Button>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
