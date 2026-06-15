import * as pdfjsLib from 'pdfjs-dist';

/**
 * Extract text from a PDF ArrayBuffer using pdfjs-dist.
 */
export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  // Configure the worker path relative to the extension root.
  // The build step (vite.config.ts) copies pdf.worker.mjs into dist/.
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.mjs');

  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => (typeof item === 'object' && 'str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}
