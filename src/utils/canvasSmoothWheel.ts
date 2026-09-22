import { Core } from 'cytoscape';

/**
 * Intercept native wheel event on canvas container to completely eliminate
 * Cytoscape's 4-event dampening heuristic and Windows mouse wheel delta explosion
 */
export function handleCanvasSmoothWheel(
  e: WheelEvent,
  cy: Core,
  container: HTMLElement,
  onZoomChange: (percent: number) => void
) {
  e.preventDefault();
  e.stopPropagation();

  const rect = container.getBoundingClientRect();
  const renderedPos = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };

  // Normalize delta across all input hardware & modes:
  // deltaMode: 0 = pixels, 1 = lines, 2 = pages
  let ticks = 0;
  if (e.deltaMode === 1) {
    ticks = e.deltaY;
  } else if (e.deltaMode === 2) {
    ticks = e.deltaY * 5;
  } else {
    // Standard mechanical wheel notch is ~100px or ~120px; touchpads give smooth smaller floats
    ticks = e.deltaY / 100;
  }

  // Clamp ticks to prevent sudden extreme hardware spikes
  const clampedTicks = Math.max(-3, Math.min(3, ticks));
  // Base zoom factor: 1.25x (snappy 25% zoom per standard mechanical notch)
  const calculatedFactor = Math.pow(1.25, -clampedTicks);
  // Hard safety bounds: single event factor is strictly bounded between 0.55x and 1.8x
  const safeFactor = Math.max(0.55, Math.min(1.8, calculatedFactor));

  const currentZoom = cy.zoom();
  const minZoom = cy.minZoom();
  const maxZoom = cy.maxZoom();
  const nextZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * safeFactor));

  if (Math.abs(nextZoom - currentZoom) > 0.0001) {
    cy.zoom({
      level: nextZoom,
      renderedPosition: renderedPos
    });
    onZoomChange(Math.round(nextZoom * 100));
  }
}
