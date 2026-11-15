"use client";

import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import {
  activeSectionIndex,
  centeredScrollLeft,
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
      <ul ref={listRef} className="flex [scrollbar-width:none] gap-1 overflow-x-auto py-2">
        {sections.map((section) => (
          <li key={section.slug} className="shrink-0">
            <a
              id={`nav-${section.slug}`}
              href={`#${sectionId(section.slug)}`}
              onClick={(event) => handleClick(event, section.slug)}
              aria-current={active === section.slug ? "true" : undefined}
              className={`rounded-pill inline-flex min-h-10 items-center px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                active === section.slug ? "bg-marino text-crema" : "hover:bg-crema-200 text-marino"
              }`}
            >
              {section.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
