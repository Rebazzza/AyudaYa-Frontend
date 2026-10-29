/**
 * Animación escalonada de los paneles del skeleton.
 *
 * Recorre los contenedores marcados con `.skeleton-stagger`, detecta los
 * "paneles" y les asigna un retraso en el orden visual: de arriba hacia abajo
 * y, dentro de cada fila, de derecha hacia izquierda. Al usar posiciones reales
 * (`getBoundingClientRect`) funciona con grillas responsivas anidadas.
 */

const PANEL_SHAPE_SELECTOR = '.skeleton, .skeleton-text, .skeleton-circle, .skeleton-card';
const LAYOUT_DISPLAYS = ['grid', 'inline-grid', 'flex', 'inline-flex'];
const STEP_MS = 80;
const ROW_TOLERANCE_PX = 8;

const isLayoutContainer = (el: Element): boolean => {
  const display = window.getComputedStyle(el).display;
  return LAYOUT_DISPLAYS.includes(display) && el.children.length >= 2;
};

/** Indica si la mayoría de los hijos directos ya son formas de skeleton (fila/panel, no layout de paneles). */
const mostlyShapes = (el: Element): boolean => {
  const children = Array.from(el.children);
  if (children.length === 0) return false;
  const shapes = children.filter((c) => c.matches(PANEL_SHAPE_SELECTOR)).length;
  return shapes / children.length >= 0.5;
};

const containsShape = (el: Element): boolean => el.querySelector(PANEL_SHAPE_SELECTOR) !== null;

/** Ordena los hijos directos: filas de arriba a abajo y, en cada fila, de derecha a izquierda. */
const orderChildren = (container: Element): Element[] => {
  const base = container.getBoundingClientRect();
  const items = Array.from(container.children).map((el) => {
    const rect = el.getBoundingClientRect();
    return { el, top: rect.top - base.top, left: rect.left - base.left };
  });

  const rows: { top: number; items: typeof items }[] = [];
  for (const item of items) {
    const row = rows.find((r) => Math.abs(r.top - item.top) <= ROW_TOLERANCE_PX);
    if (row) {
      row.items.push(item);
    } else {
      rows.push({ top: item.top, items: [item] });
    }
  }

  rows.sort((a, b) => a.top - b.top);
  const ordered: Element[] = [];
  for (const row of rows) {
    row.items.sort((a, b) => b.left - a.left);
    for (const item of row.items) ordered.push(item.el);
  }
  return ordered;
};

/** Asigna retrasos consecutivos a los paneles, siguiendo el orden visual. */
const processPanels = (container: Element, start: number): number => {
  let index = start;
  for (const child of orderChildren(container)) {
    if (isLayoutContainer(child) && !mostlyShapes(child)) {
      // Grilla/flex de tarjetas: se escalonan sus hijos (paneles).
      index = processPanels(child, index);
    } else if (child.matches(PANEL_SHAPE_SELECTOR) || containsShape(child)) {
      const el = child as HTMLElement;
      el.style.animation = 'skeleton-rise 0.5s ease-out both';
      el.style.animationDelay = `${index * STEP_MS}ms`;
      index += 1;
    } else if (child.children.length > 0) {
      index = processPanels(child, index);
    }
  }
  return index;
};

/**
 * Inicializa la animación escalonada. El callback del observer corre como
 * microtask (antes del pintado), por lo que los retrasos se aplican sin
 * parpadeo.
 */
export function initSkeletonStagger(doc: Document = document): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const run = () => {
    const containers = doc.querySelectorAll<HTMLElement>('.skeleton-stagger');
    containers.forEach((container) => {
      if (container.dataset['skeletonStaggerDone'] === '1') return;
      processPanels(container, 0);
      container.dataset['skeletonStaggerDone'] = '1';
    });
  };

  run();
  const observer = new MutationObserver(run);
  observer.observe(doc.body, { childList: true, subtree: true });
}