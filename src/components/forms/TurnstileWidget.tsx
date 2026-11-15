"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  /** Cambiar este número reinicia el widget (por ejemplo, tras un rechazo del servidor). */
  resetKey?: number;
  error?: string;
};

/**
 * F2-14 · Cloudflare Turnstile en modo “managed”: casi siempre invisible, en español y accesible.
 * El token se valida en el servidor (lib/turnstile.ts) antes de guardar nada.
 */
export function TurnstileWidget({ onToken, resetKey = 0, error }: TurnstileWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  const render = useCallback(() => {
    if (!window.turnstile || !container.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      language: "es",
      theme: "light",
      appearance: "interaction-only",
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }, [onToken, siteKey]);

  useEffect(() => {
    if (isReady) render();
  }, [isReady, render]);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current) {
      onToken("");
      window.turnstile?.reset(widgetId.current);
    }
  }, [resetKey, onToken]);

  useEffect(
    () => () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
    },
    [],
  );

  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setIsReady(true)}
      />
      <div ref={container} />
      {error ? (
        <p role="alert" className="text-rocoto-texto mt-1 text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
