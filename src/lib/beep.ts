/**
 * Alerta sonora de pedido o reserva nueva (Web Audio, sin archivos): tres «ding-dong» seguidos,
 * unos 2 segundos, para que el personal se entere aunque esté en otra cosa. Los navegadores solo
 * dejan sonar después de que la persona tocó la página al menos una vez (por eso «Sonido» se
 * activa con un clic).
 */

/** Cada nota: frecuencia (Hz), inicio (s desde ahora) y duración (s). */
export const ALERT_NOTES: ReadonlyArray<{ hz: number; at: number; length: number }> = [
  { hz: 880, at: 0, length: 0.32 },
  { hz: 1175, at: 0.34, length: 0.5 },
  { hz: 880, at: 0.9, length: 0.32 },
  { hz: 1175, at: 1.24, length: 0.5 },
  { hz: 880, at: 1.8, length: 0.32 },
  { hz: 1175, at: 2.14, length: 0.7 },
];

const VOLUME = 0.45;

let shared: AudioContext | null = null;

/** Un solo contexto de audio para toda la página: crear uno por aviso termina bloqueado. */
function context(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  shared ??= new AudioContext();
  return shared;
}

/** Duración total de la alerta, en segundos. */
export const ALERT_SECONDS = Math.max(...ALERT_NOTES.map((n) => n.at + n.length));

export function beep(): void {
  try {
    const ctx = context();
    if (!ctx) return;
    // Si el navegador lo dejó dormido (sin clic reciente), intenta despertarlo.
    if (ctx.state === "suspended") void ctx.resume();
    const start = ctx.currentTime + 0.02;
    for (const note of ALERT_NOTES) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = note.hz;
      const t0 = start + note.at;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(VOLUME, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + note.length + 0.05);
    }
  } catch {
    // Sin audio disponible: el aviso visual sigue funcionando.
  }
}
