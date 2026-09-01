/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportOptions {
  fileName: string;
  pdfWidthMm?: number; // Base width in mm (e.g. 105 for A6, 148 for A5, 210 for A4)
  scale?: number;
  backgroundColor?: string;
}

/**
 * Prepares the DOM element and ensures all fonts and images are completely loaded
 * before capturing to canvas for high-fidelity WYSIWYG export.
 */
export async function prepareElementForCapture(element: HTMLElement): Promise<void> {
  // 1. Wait for custom web fonts (Inter, Space Grotesk, JetBrains Mono)
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch (err) {
    console.warn('Font loading check completed with warning:', err);
  }

  // 2. Wait for all <img> elements inside the container to be loaded
  const imgElements = Array.from(element.querySelectorAll('img'));
  if (imgElements.length > 0) {
    await Promise.all(
      imgElements.map((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          const timer = setTimeout(() => resolve(), 3000); // 3s safety timeout
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
        });
      })
    );
  }

  // 3. Allow a short browser tick for any CSS animations or layout shifts to settle
  await new Promise((resolve) => setTimeout(resolve, 150));
}

/**
 * Exports an HTML element directly to a high-resolution PNG image,
 * guaranteeing 100% WYSIWYG fidelity matching what the user sees on screen.
 */
export async function exportElementAsImage(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  await prepareElementForCapture(element);

  // Apply exporting class to unroll scrollbars and display full content
  element.classList.add('is-exporting');

  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 3, // 3x scale produces 300+ DPI crisp output
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth || element.offsetWidth,
      windowHeight: element.scrollHeight || element.offsetHeight,
      onclone: (clonedDoc) => {
        const target = clonedDoc.getElementById(element.id);
        if (target) {
          target.style.overflow = 'visible';
          target.style.maxHeight = 'none';
          target.style.height = 'auto';
          target.style.boxShadow = 'none';
        }
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = options.fileName.endsWith('.png')
      ? options.fileName
      : `${options.fileName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    element.classList.remove('is-exporting');
  }
}

/**
 * Exports an HTML element to a PDF with dynamically computed page dimensions
 * matching the element's exact aspect ratio. Prevents squishing, stretching,
 * clipping, and unwanted blank pages.
 */
export async function exportElementAsPDF(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  await prepareElementForCapture(element);

  // Apply exporting class to unroll scrollbars and display full content
  element.classList.add('is-exporting');

  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 3, // 3x scale produces 300+ DPI crisp raster inside PDF
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth || element.offsetWidth,
      windowHeight: element.scrollHeight || element.offsetHeight,
      onclone: (clonedDoc) => {
        const target = clonedDoc.getElementById(element.id);
        if (target) {
          target.style.overflow = 'visible';
          target.style.maxHeight = 'none';
          target.style.height = 'auto';
          target.style.boxShadow = 'none';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Calculate exact PDF dimensions to preserve 100% aspect ratio
    const baseWidthMm = options.pdfWidthMm || 105; // Default 105mm (A6)
    const exactHeightMm = (canvas.height * baseWidthMm) / canvas.width;

    const orientation = exactHeightMm >= baseWidthMm ? 'portrait' : 'landscape';

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [baseWidthMm, exactHeightMm],
      compress: true,
    });

    // Add image fitting 1:1 on the custom-sized PDF canvas
    pdf.addImage(imgData, 'PNG', 0, 0, baseWidthMm, exactHeightMm, undefined, 'FAST');

    const finalFileName = options.fileName.endsWith('.pdf')
      ? options.fileName
      : `${options.fileName}.pdf`;

    pdf.save(finalFileName);
  } finally {
    element.classList.remove('is-exporting');
  }
}
