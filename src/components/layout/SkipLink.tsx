/** Primer elemento enfocable: salta la navegación (WCAG 2.4.1). */
export function SkipLink({ targetId = "contenido" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="bg-aji text-marino rounded-pill fixed top-2 left-2 z-50 -translate-y-24 px-5 py-3 font-semibold shadow-md transition-transform focus-visible:translate-y-0"
    >
      Saltar al contenido
    </a>
  );
}
