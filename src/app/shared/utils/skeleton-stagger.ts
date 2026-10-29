/**
 * Animaciones de entrada para paneles.
 *
 * - `.skeleton-stagger`: paneles del skeleton, en orden arriba->abajo y
 *   derecha->izquierda.
 * - `.content-stagger`: paneles ya cargados, en orden arriba->abajo y
 *   izquierda->derecha.
 *
 * El orden y los retrasos se calculan con la posición real de cada panel
 * (`getBoundingClientRect`), de modo que funciona con grillas responsivas
 * anidadas.
 */

const PANEL_SHAPE_SELECTOR = '.skeleton, .skeleton-text, .skeleton-circle, .skeleton-card';
const LAYOUT_DISPLAYS = ['grid', 'inline-grid', 'flex', 'inline-flex'];
const STEP_MS = 80;
const ROW_TOLERANCE_PX = 8;

const isLayoutContainer = (el: Element): boolean => {
  const display = window.getComputedStyle(el).display;
  return LAYOUT_DISPLAYS.includes(display) && el.children.length >= 2;
};

const isGridContainer = (el: Element): boolean => {
  const display = window.getComputedStyle(el).display;
  return (display === 'grid' || display === 'inline-grid') && el.children.length >= 2;
};

/** Indica si la mayoría de los hijos directos ya son formas de skeleton (fila/panel, no layout de paneles). */
const mostlyShapes = (el: Element): boolean => {
  const children = Array.from(el.children);
  if (children.length === 0) return false;
  const shapes = children.filter((c) => c.matches(PANEL_SHAPE_SELECTOR)).length;
  return shapes / children.length >= 0.5;
};

const containsShape = (el: Element): boolean => el.querySelector(PANEL_SHAPE_SELECTOR) !== null;

/**
 * Ordena los hijos directos: filas de arriba a abajo y, dentro de cada fila,
 * de derecha a izquierda (`rightToLeft`) o de izquierda a derecha.
 */
const orderChildren = (container: Element, rightToLeft: boolean): Element[] => {
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
    row.items.sort((a, b) => (rightToLeft ? b.left - a.left : a.left - b.left));
    for (const item of row.items) ordered.push(item.el);
  }
  return ordered;
};

const reveal = (el: Element, index: number): void => {
  const node = el as HTMLElement;
  node.style.animation = 'skeleton-rise 0.5s ease-out both';
  node.style.animationDelay = `${index * STEP_MS}ms`;
};

/** Skeleton: arriba->abajo, dentro de cada fila derecha->izquierda. */
const processSkeleton = (container: Element, start: number): number => {
  let index = start;
  for (const child of orderChildren(container, true)) {
    if (isLayoutContainer(child) && !mostlyShapes(child)) {
      index = processSkeleton(child, index);
    } else if (child.matches(PANEL_SHAPE_SELECTOR) || containsShape(child)) {
      reveal(child, index);
      index += 1;
    } else if (child.children.length > 0) {
      index = processSkeleton(child, index);
    }
  }
  return index;
};

/** Contenido cargado: arriba->abajo, dentro de cada fila izquierda->derecha. */
const processContent = (container: Element, start: number): number => {
  let index = start;
  for (const child of orderChildren(container, false)) {
    if (isGridContainer(child)) {
      // Grilla de paneles: se escalonan sus tarjetas de izquierda a derecha.
      index = processContent(child, index);
    } else {
      reveal(child, index);
      index += 1;
    }
  }
  return index;
};

/**
 * Inicializa las animaciones. El callback del observer corre como microtask
 * (antes del pintado), por lo que los retrasos se aplican sin parpadeo.
 */
export function initPanelReveal(doc: Document = document): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const run = () => {
    doc.querySelectorAll<HTMLElement>('.skeleton-stagger').forEach((container) => {
      if (container.dataset['skeletonStaggerDone'] === '1') return;
      processSkeleton(container, 0);
      container.dataset['skeletonStaggerDone'] = '1';
    });

    doc.querySelectorAll<HTMLElement>('.content-stagger').forEach((container) => {
      if (container.dataset['contentStaggerDone'] === '1') return;
      processContent(container, 0);
      container.dataset['contentStaggerDone'] = '1';
    });
  };

  run();
  const observer = new MutationObserver(run);
  observer.observe(doc.body, { childList: true, subtree: true });
}