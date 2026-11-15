"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import {
  activeSectionIndex,
  arrowScrollLeft,
  centeredScrollLeft,
  scrollEdges,
  sectionScrollTarget,
} from "@/features/catalog/section-spy";

type SectionLink = { slug: string; name: string };

/** Si el navegador no emite `scrollend` (Safari), el bloqueo se libera solo. */
const LOCK_FALLBACK_MS = 1000;
const sectionId = (slug: string) => `seccion-${slug}`;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Barra de secciones fija con scroll-spy. Reglas para que no "salte":
 * - La sección activa se calcula midiendo TODAS las secciones (la última que pasó bajo la barra).
 * - El chip activo se centra moviendo solo la barra horizontal, nunca la página.
 * - Al tocar un chip, el spy se congela hasta que termina el desplazamiento.
 */
export function SectionNav({ sections }: { sections: readonly SectionLink[] }) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const lockRef = useRef(false);
  const [active, setActive] = useState(sections[0]?.slug);
  const [edges, setEdges] = useState({ canLeft: false, canRight: false });

  const updateEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setEdges(
      scrollEdges({
        scrollLeft: list.scrollLeft,
        width: list.clientWidth,
        scrollWidth: list.scrollWidth,
      }),
    );
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    updateEdges();
    list.addEventListener("scroll", updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(list);
    return () => {
      list.removeEventListener("scroll", updateEdges);
      observer.disconnect();
    };
  }, [updateEdges, sections]);

  function scrollBar(direction: -1 | 1) {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({
      left: arrowScrollLeft(
        { scrollLeft: list.scrollLeft, width: list.clientWidth, scrollWidth: list.scrollWidth },
        direction,
      ),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  const measure = useCallback(() => {
    const nav = navRef.current;
    if (!nav || lockRef.current) return;
    const tops = sections.map(
      (s) => document.getElementById(sectionId(s.slug))?.getBoundingClientRect().top ?? Infinity,
    );
    const index = activeSectionIndex(tops, nav.getBoundingClientRect().bottom);
    setActive(sections[index]?.slug);
  }, [sections]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [measure]);

  useEffect(() => {
    const list = listRef.current;
    const chip = active ? document.getElementById(`nav-${active}`) : null;
    if (!list || !chip) return;
    list.scrollTo({
      left: centeredScrollLeft(
        { offsetLeft: chip.offsetLeft, width: chip.offsetWidth },
        { width: list.clientWidth, scrollWidth: list.scrollWidth },
      ),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [active]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>, slug: string) {
    const nav = navRef.current;
    const section = document.getElementById(sectionId(slug));
    if (!nav || !section) return;
    event.preventDefault();

    const stuckBottom = (Number.parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight;
    const top = sectionScrollTarget(
      section.getBoundingClientRect().top,
      window.scrollY,
      stuckBottom,
    );

    lockRef.current = true;
    setActive(slug);
    const release = () => {
      lockRef.current = false;
      window.removeEventListener("scrollend", release);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      clearTimeout(timer);
      measure();
    };
    const timer = setTimeout(release, LOCK_FALLBACK_MS);
    window.addEventListener("scrollend", release, { once: true });
    // Si la persona vuelve a desplazar con la mano, el spy retoma el control.
    window.addEventListener("wheel", release, { once: true, passive: true });
    window.addEventListener("touchstart", release, { once: true, passive: true });

    window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    history.replaceState(null, "", `#${sectionId(slug)}`);
    section.focus({ preventScroll: true });
  }

  return (
    <nav
      ref={navRef}
      aria-label="Secciones de la carta"
      className="bg-fondo/95 border-borde sticky top-0 z-20 -mx-4 border-b px-4 backdrop-blur md:top-[var(--altura-header)]"
    >
      <div className="relative">
        {edges.canLeft ? <ArrowButton direction={-1} onClick={() => scrollBar(-1)} /> : null}
        <ul
          ref={listRef}
          className="relative flex [scrollbar-width:none] gap-1 overflow-x-auto py-2 [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((section) => (
            <li key={section.slug} className="shrink-0">
              <a
                id={`nav-${section.slug}`}
                href={`#${sectionId(section.slug)}`}
                onClick={(event) => handleClick(event, section.slug)}
                aria-current={active === section.slug ? "true" : undefined}
                className={`rounded-pill inline-flex min-h-10 items-center px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active === section.slug
                    ? "bg-marino text-crema"
                    : "hover:bg-crema-200 text-marino"
                }`}
              >
                {section.name}
              </a>
            </li>
          ))}
        </ul>
        {edges.canRight ? <ArrowButton direction={1} onClick={() => scrollBar(1)} /> : null}
      </div>
    </nav>
  );
}

/**
 * Flecha sobre el borde de la barra con degradado: indica que hay más secciones y permite
 * moverse sin arrastrar (útil con mouse o para quien no sabe deslizar). 44 px de área táctil.
 */
function ArrowButton({ direction, onClick }: { direction: -1 | 1; onClick: () => void }) {
  const isLeft = direction === -1;
  const Icon = isLeft ? ChevronLeft : ChevronRight;
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 z-10 flex items-center ${
        isLeft
          ? "from-fondo -left-1 bg-gradient-to-r from-60% to-transparent pr-6"
          : "from-fondo -right-1 bg-gradient-to-l from-60% to-transparent pl-6"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={isLeft ? "Ver secciones anteriores" : "Ver más secciones"}
        className="bg-superficie border-borde text-marino hover:bg-aji hover:border-aji pointer-events-auto flex size-11 items-center justify-center rounded-full border shadow-md transition-colors"
      >
        <Icon aria-hidden="true" className="size-6" />
      </button>
    </div>
  );
}
