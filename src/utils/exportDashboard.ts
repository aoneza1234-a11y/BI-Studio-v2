import html2canvas from 'html2canvas';

export interface ExportImageOptions {
  elementId: string;
  fileName?: string;
}

/**
 * Exports a specific DOM element as a high-resolution PNG image
 */
export async function exportDashboardAsPng({
  elementId,
  fileName = 'dashboard-export',
}: ExportImageOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`ไม่พบองค์ประกอบหน้าจอที่ต้องการส่งออก (id: ${elementId})`);
  }

  // Generate canvas with scale factor for crisp retina-quality output
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#f8fafc', // slate-50 background
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDoc) => {
      // Ensure clone element has proper dimensions and no scrollbars
      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.width = '100%';
        clonedEl.style.height = 'auto';
        clonedEl.style.padding = '24px';
      }
    },
  });

  // Convert canvas to blob and download
  const image = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = image;
  link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
