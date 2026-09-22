import { Core } from 'cytoscape';

/**
 * Exports the full Cytoscape graph as a high-resolution PNG image
 */
export function exportGraphToPng(cy: Core, projectName: string, isDark: boolean) {
  const pngData = cy.png({
    full: true,
    scale: 2,
    bg: isDark ? '#121214' : '#FAF8F5'
  });
  const a = document.createElement('a');
  a.href = pngData;
  const cleanName = projectName.replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '') || 'mathmind_graph';
  a.download = `${cleanName}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
