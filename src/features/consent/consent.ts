/** F4-08 · Consentimiento de cookies de analítica (guardado en el navegador del visitante). */
export type Consent = "accepted" | "rejected";

const KEY = "berypez:cookies";

export function readConsent(storage: Storage | undefined): Consent | null {
  try {
    const value = storage?.getItem(KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(storage: Storage | undefined, consent: Consent): void {
  try {
    storage?.setItem(KEY, consent);
  } catch {
    // Sin almacenamiento: la elección vale solo para esta visita.
  }
}

/** Solo se carga analítica con consentimiento explícito y un ID configurado. */
export function shouldLoadAnalytics(consent: Consent | null, gaId: string | undefined): boolean {
  return consent === "accepted" && Boolean(gaId && /^G-[A-Z0-9]+$/.test(gaId));
}
