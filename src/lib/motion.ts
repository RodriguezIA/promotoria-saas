import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";

/**
 * Utilidades de movimiento del design system (GSAP).
 *
 * Convenciones:
 * - Duraciones cortas (0.2s–0.5s) y easing "power3.out" para UI.
 * - Respetar siempre `prefers-reduced-motion`.
 * - Para animaciones simples de entrada usa las clases CSS
 *   (`animate-page-in`, `animate-fade-up`, `stagger-children`);
 *   GSAP es para transiciones de ruta, contadores y secuencias.
 */

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const EASE = "power3.out";

/**
 * Anima la entrada de la página en cada cambio de ruta.
 * Úsalo en el contenedor del <Outlet /> (Layout).
 */
export function usePageTransition<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: EASE, clearProps: "all" },
      );
    });

    return () => ctx.revert();
  }, [pathname]);

  return ref;
}

/**
 * Revela en cascada los hijos directos de un contenedor al montar.
 * Ideal para grids de cards y listas.
 *
 *   const ref = useStaggerReveal<HTMLDivElement>();
 *   <div ref={ref} className="grid ...">{cards}</div>
 */
export function useStaggerReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!.children,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: EASE,
          stagger: 0.05,
          clearProps: "all",
        },
      );
    }, ref);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * Cuenta animada para cifras de dashboard (StatCard).
 * Devuelve un ref para el elemento que muestra el número.
 */
export function useCountUp<T extends HTMLElement>(
  value: number,
  options?: { duration?: number; formatter?: (v: number) => string },
) {
  const ref = useRef<T>(null);
  const format = options?.formatter ?? ((v: number) => Math.round(v).toLocaleString("es-MX"));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.textContent = format(value);
      return;
    }

    const state = { v: 0 };
    const tween = gsap.to(state, {
      v: value,
      duration: options?.duration ?? 0.8,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = format(state.v);
      },
    });

    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return ref;
}
