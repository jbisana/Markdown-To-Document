/**
 * Export utilities for Markdown to Document Studio.
 */

export interface ExportOptions {
  pageSize: 'a4' | 'letter';
  margins: 'normal' | 'narrow' | 'none';
  filename?: string;
}

const MARGIN_MAP = {
  normal: 20,
  narrow: 10,
  none: 0
};

async function convertMermaidToImages(container: HTMLElement, scale: number = 3) {
  const mermaids = container.querySelectorAll('.mermaid');
  
  for (const mermaidDiv of Array.from(mermaids)) {
    const svg = mermaidDiv.querySelector('svg');
    if (!svg) continue;

    // Get SVG data and convert to base64
    const svgData = new XMLSerializer().serializeToString(svg);
    const base64 = btoa(encodeURIComponent(svgData).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
    const url = `data:image/svg+xml;base64,${base64}`;

    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise((resolve) => {
      img.onload = () => {
        try {
          // Use a high scale for high-quality images
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Use white background for exports to ensure visibility on white paper
            ctx.fillStyle = '#ffffff'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          
          const pngUrl = canvas.toDataURL('image/png', 1.0);
          const imgTag = document.createElement('img');
          imgTag.src = pngUrl;
          imgTag.style.width = '100%';
          imgTag.style.maxWidth = '100%';
          imgTag.style.display = 'block';
          imgTag.style.margin = '10px auto';
          imgTag.style.borderRadius = '4px';
          imgTag.style.border = '1px solid #eee';
          
          mermaidDiv.innerHTML = '';
          mermaidDiv.appendChild(imgTag);
          resolve(null);
        } catch (err) {
          console.error('Failed to export mermaid as image:', err);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
}

export async function exportToPDF(elementId: string, options: ExportOptions) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Clone the element to process Mermaid diagrams without affecting the live preview
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Convert Mermaid SVGs to High-Quality Images in the clone
  await convertMermaidToImages(clone, 3);

  const margin = MARGIN_MAP[options.margins];
  const targetWidth = options.pageSize === 'a4' ? 794 : 816;

  // Construct a complete HTML document string with embedded styles
  // This is often more reliable than passing a live DOM element
  const styledHtml = `
    <div class="markdown-body" style="
      width: ${targetWidth}px; 
      padding: 0; 
      margin: 0; 
      background: white; 
      color: black;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    ">
      <style>
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { 
          color: black; 
          border-bottom: 1px solid #eaecef; 
          padding-bottom: 0.3em;
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        .markdown-body h1 { border-bottom: 2px solid #333; }
        .markdown-body p, .markdown-body li { 
          line-height: 1.6; 
          margin-bottom: 16px; 
          color: #24292e;
        }
        .markdown-body code { 
          background-color: rgba(27,31,35,0.05); 
          border-radius: 3px; 
          font-size: 85%; 
          margin: 0; 
          padding: 0.2em 0.4em; 
          font-family: monospace;
        }
        .markdown-body pre { 
          background-color: #f6f8fa; 
          border-radius: 3px; 
          font-size: 85%; 
          line-height: 1.45; 
          overflow: auto; 
          padding: 16px;
          margin-bottom: 16px;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .markdown-body table { 
          border-spacing: 0; 
          border-collapse: collapse; 
          width: 100%; 
          margin-bottom: 16px;
        }
        .markdown-body table th, .markdown-body table td { 
          border: 1px solid #dfe2e5; 
          padding: 6px 13px; 
        }
        .markdown-body table tr:nth-child(2n) { background-color: #f6f8fa; }
        .markdown-body img { max-width: 100%; box-sizing: content-box; background-color: #fff; }
      </style>
      ${clone.innerHTML}
    </div>
  `;

  const opt = {
    margin: margin,
    filename: options.filename || 'document.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
      backgroundColor: '#ffffff',
      width: targetWidth
    },
    jsPDF: { 
      unit: 'mm', 
      format: options.pageSize, 
      orientation: 'portrait'
    },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  try {
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      await window.html2pdf().set(opt).from(styledHtml).save();
    }
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
}

export async function copyWYSIWYG(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const clone = element.cloneNode(true) as HTMLElement;
  await convertMermaidToImages(clone, 2);
  
  const styles: Record<string, string> = {
    'h1': 'font-size: 24pt; font-weight: bold; color: #000; margin: 20pt 0 12pt; border-bottom: 2px solid #333; padding-bottom: 6pt;',
    'h2': 'font-size: 18pt; font-weight: bold; color: #000; margin: 16pt 0 10pt; border-bottom: 1px solid #666; padding-bottom: 4pt;',
    'h3': 'font-size: 14pt; font-weight: bold; color: #000; margin: 12pt 0 8pt;',
    'p': 'margin-bottom: 10pt; line-height: 1.6; color: #000;',
    'code': 'font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; color: #c00;',
    'pre': 'background: #f8f8f8; padding: 12px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 12pt; color: #000;',
    'blockquote': 'border-left: 4px solid #ddd; padding-left: 16px; font-style: italic; color: #444; margin-bottom: 12pt; background: #f9f9f9;',
    'table': 'border-collapse: collapse; width: 100%; margin-bottom: 12pt;',
    'th': 'border: 1px solid #666; padding: 8px; background: #f2f2f2; text-align: left; font-weight: bold;',
    'td': 'border: 1px solid #666; padding: 8px; text-align: left;',
    'ul': 'margin-bottom: 12pt; padding-left: 24px;',
    'ol': 'margin-bottom: 12pt; padding-left: 24px;',
    'li': 'margin-bottom: 4pt;',
    'img': 'max-width: 100%; display: block; margin: 12pt auto; border: 1px solid #eee;'
  };

  Object.entries(styles).forEach(([tag, style]) => {
    clone.querySelectorAll(tag).forEach(el => {
      (el as HTMLElement).style.cssText += style;
    });
  });

  const html = clone.innerHTML;
  const blob = new Blob([html], { type: 'text/html' });
  const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([element.innerText], { type: 'text/plain' }) })];

  await navigator.clipboard.write(data);
}


