/**
 * A custom regex-based Markdown parser for Markdown to Document Studio.
 * Supports: Headings, Bold, Italic, Strikethrough, Inline Code, Fenced Code Blocks,
 * Tables, Lists (Nested), Task Lists, Blockquotes, and HR.
 */

export function parseMarkdown(markdown: string): string {
  let html = markdown;

  // 1. Escape HTML to prevent XSS (basic)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Handle Fenced Code Blocks (including Mermaid)
  // We use a unique placeholder that doesn't trigger markdown rules (avoiding __ or **)
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\s*\n([\s\S]*?)\n?```/g, (_, lang, code) => {
    const id = `:::BLOCK_${codeBlocks.length}:::`;
    if (lang === 'mermaid') {
      codeBlocks.push(`<div class="mermaid">${code.trim()}</div>`);
    } else {
      codeBlocks.push(`<pre><code class="language-${lang}">${code.trim()}</code></pre>`);
    }
    return `\n${id}\n`;
  });

  // 3. Block Elements
  
  // Headings
  html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Horizontal Rule
  html = html.replace(/^---$/gm, '<hr />');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br />');

  // Tables
  html = html.replace(/^\|(.+)\|$\n^\|([-|\s]+)\|$\n((?:^\|.+\|$\n?)+)/gm, (match, header, divider, rows) => {
    const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th>${h.trim()}</th>`).join('');
    const bodyRows = rows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  });

  // Lists (Unordered)
  // Handle task lists
  html = html.replace(/^\s*[\-\*] \[ \] (.*$)/gm, '<li><input type="checkbox" disabled /> $1</li>');
  html = html.replace(/^\s*[\-\*] \[x\] (.*$)/gm, '<li><input type="checkbox" checked disabled /> $1</li>');
  
  // Basic lists
  html = html.replace(/^\s*[\-\*] (.*$)/gm, '<li>$1</li>');
  
  // Lists (Ordered)
  html = html.replace(/^\s*\d+\. (.*$)/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul> or <ol>
  html = html.replace(/(?:^|\n)(<li>.*<\/li>(?:\n<li>.*<\/li>)*)/g, (match) => {
    return `\n<ul>${match.trim()}</ul>\n`;
  });

  // 4. Inline Elements
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Images
  html = html.replace(/\!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');

  // 5. Paragraphs
  const blockTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote', 'ul', 'ol', 'table', 'hr', 'div'];
  const lines = html.split('\n');
  html = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    const isBlock = blockTags.some(tag => trimmed.startsWith(`<${tag}`) || trimmed.startsWith(`:::BLOCK`));
    return isBlock ? line : `<p>${line}</p>`;
  }).join('\n');

  // 6. Restore Code Blocks
  codeBlocks.forEach((block, i) => {
    html = html.replace(`:::BLOCK_${i}:::`, () => block);
  });

  return html;
}
