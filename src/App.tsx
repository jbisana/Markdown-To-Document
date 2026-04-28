import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  Trash2, 
  Copy, 
  FileDown, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Layout,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  X,
  Settings,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import mermaid from 'mermaid';
import { parseMarkdown } from './lib/markdownParser';
import { exportToPDF, copyWYSIWYG, ExportOptions } from './lib/exportUtils';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Toast Component
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const DEFAULT_MARKDOWN = `# Welcome to Document Studio 🚀

## Core Features
- **Live Preview**: See changes as you type.
- **Custom Parser**: Regex-based, lightweight, and fast.
- **Mermaid Diagrams**: Create flowcharts, sequence diagrams, and more.
- **Export Options**: PDF, Word (.docx), and WYSIWYG Copy.

### Complex Architecture Example
\`\`\`mermaid
graph TD
    %% User and Entry Point
    User([User / Client]) -->|HTTPS| NPM[Nginx Proxy Manager]
    NPM -->|Internal:3000| AppLayer[LuxeEstate App Container]

    subgraph AppLayer [App Container: Express + Vite]
        Vite[Vite Dev/Prod Server]
        Express[Express.js API]
        Vite <--> Express
    end

    %% Frontend interactions
    User <-->|React SPA| Vite

    %% Backend and Data Layer
    Express -->|Prisma| DB[(PostgreSQL)]
    Express -->|Session| Redis[(Redis)]

    %% External AI & Automation
    Express -->|API Request| GeminiAPI[Gemini 1.5 AI]
    Express -->|Webhook Trigger| n8n[n8n Workflow]

    subgraph ExternalServices [External Services]
        GeminiAPI
        n8n
    end

    %% Notifications
    n8n --> Telegram[Telegram Notification]
    n8n --> Slack[Slack Lead Channel]

    %% Admin Workflow
    Admin([Estate Admin]) -->|Auth Login| Express
    Admin -->|CMS Dashboard| DB
\`\`\`

### Task List
- [x] Implement Regex Parser
- [x] Add Mermaid Support
- [x] Build PDF Export
- [ ] Add Cloud Sync (Coming Soon)

### Tables
| Feature | Status | Priority |
| :--- | :---: | :--- |
| PDF Export | ✅ | High |
| Word Export | ✅ | High |
| Dark Mode | ✅ | Medium |

> "Simplicity is the ultimate sophistication." — Leonardo da Vinci

---
*Created with ❤️ by Document Studio - Jeremy Bisana*
`;

// Memoized Preview Component to prevent re-renders from wiping Mermaid diagrams
const Preview = memo(({ html }: { html: string }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const nodes = document.querySelectorAll('.mermaid');
      if (nodes.length > 0) {
        try {
          await mermaid.run({
            nodes: Array.from(nodes) as HTMLElement[],
          });
          
          nodes.forEach(node => {
            const svg = node.querySelector('svg');
            if (svg) {
              svg.style.maxWidth = '100%';
              svg.style.height = 'auto';
              svg.style.display = 'block';
              svg.style.margin = '0 auto';
            }
          });
        } catch (err) {
          console.error('Mermaid rendering failed:', err);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [html]);

  return (
    <div 
      id="preview-content"
      ref={previewRef}
      className="markdown-body max-w-3xl mx-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export default function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [html, setHtml] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    pageSize: 'a4',
    margins: 'normal',
    filename: 'document'
  });
  
  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#cba6f7',
        primaryTextColor: '#cdd6f4',
        primaryBorderColor: '#cba6f7',
        lineColor: '#89b4fa',
        secondaryColor: '#89b4fa',
        tertiaryColor: '#313244',
        mainBkg: '#181825',
        nodeBorder: '#cba6f7',
        clusterBkg: '#1e1e2e',
        clusterBorder: '#45475a',
        defaultLinkColor: '#89b4fa',
        titleColor: '#cba6f7',
        edgeLabelBackground: '#313244',
      }
    });
  }, []);

  // Parse Markdown
  useEffect(() => {
    const parsed = parseMarkdown(markdown);
    setHtml(parsed);
  }, [markdown]);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handleClear = () => {
    setMarkdown('');
    addToast('Content cleared');
  };

  const handleCopy = async () => {
    try {
      await copyWYSIWYG('preview-content');
      addToast('Copied to clipboard with styles!');
    } catch (err) {
      addToast('Failed to copy', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      addToast('Generating PDF...');
      await exportToPDF('preview-content', {
        ...exportOptions,
        filename: `${exportOptions.filename || 'document'}.pdf`
      });
      addToast('PDF downloaded!');
    } catch (err) {
      addToast('Failed to export PDF', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base text-text">
      {/* Header */}
      <header className="h-16 border-b border-surface0 bg-mantle flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-mauve rounded-xl flex items-center justify-center shadow-lg shadow-mauve/20">
            <Layout className="text-base w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-mauve tracking-tight">Document Studio</h1>
            <p className="text-[10px] uppercase tracking-widest text-overlay1 font-mono">Markdown to Document</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleClear}
            className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors group relative"
            title="Clear All"
          >
            <Trash2 className="w-5 h-5" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-surface2 text-text text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Clear</span>
          </button>
          
          <div className="w-px h-6 bg-surface0 mx-2" />

          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-surface0 hover:bg-surface1 text-text rounded-lg transition-all border border-surface1"
          >
            <Copy className="w-4 h-4 text-blue" />
            <span className="text-sm font-medium">Copy WYSIWYG</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-lg transition-all border",
                showSettings ? "bg-mauve text-base border-mauve" : "bg-surface0 text-text border-surface1 hover:bg-surface1"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-mantle border border-surface0 rounded-xl shadow-2xl p-4 z-[60]"
                >
                  <h3 className="text-sm font-bold text-mauve mb-3 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" /> Export Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-overlay1 font-bold block mb-1.5">Filename</label>
                      <input 
                        type="text" 
                        value={exportOptions.filename}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
                        className="w-full bg-base border border-surface0 rounded-lg px-3 py-1.5 text-sm focus:border-mauve outline-none transition-colors text-text"
                        placeholder="document"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-overlay1 font-bold block mb-1.5">Page Size</label>
                        <div className="relative">
                          <select 
                            value={exportOptions.pageSize}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, pageSize: e.target.value as any }))}
                            className="w-full bg-base border border-surface0 rounded-lg px-2 py-1.5 text-sm focus:border-mauve outline-none transition-colors appearance-none cursor-pointer text-text pr-8"
                          >
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-overlay1 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-overlay1 font-bold block mb-1.5">Margins</label>
                        <div className="relative">
                          <select 
                            value={exportOptions.margins}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, margins: e.target.value as any }))}
                            className="w-full bg-base border border-surface0 rounded-lg px-2 py-1.5 text-sm focus:border-mauve outline-none transition-colors appearance-none cursor-pointer text-text pr-8"
                          >
                            <option value="normal">Normal</option>
                            <option value="narrow">Narrow</option>
                            <option value="none">None</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-overlay1 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-mauve hover:bg-mauve/90 text-base rounded-lg transition-all shadow-lg shadow-mauve/10"
          >
            <FileDown className="w-4 h-4" />
            <span className="text-sm font-medium">Export PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex overflow-hidden",
        isFullscreen ? "fixed inset-0 z-[60] bg-base" : ""
      )}>
        {/* Editor Pane */}
        <section className="flex-1 flex flex-col border-r border-surface0 bg-crust">
          <div className="h-10 border-b border-surface0 flex items-center justify-between px-4 bg-mantle">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-mauve" />
              <span className="text-xs font-mono uppercase tracking-widest text-overlay1">Markdown Input</span>
            </div>
            <div className="text-[10px] font-mono text-overlay0">
              {markdown.length} characters
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 bg-transparent text-text font-mono text-sm resize-none focus:outline-none leading-relaxed selection:bg-mauve/30"
              placeholder="Start typing your markdown here..."
              spellCheck={false}
            />
          </div>
        </section>

        {/* Preview Pane */}
        <section className="flex-1 flex flex-col bg-base overflow-hidden">
          <div className="h-10 border-b border-surface0 flex items-center justify-between px-4 bg-mantle">
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4 text-blue" />
              <span className="text-xs font-mono uppercase tracking-widest text-overlay1">Live Preview</span>
            </div>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-surface0 rounded transition-colors text-overlay1"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <Preview html={html} />
          </div>
        </section>
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[100]">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border min-w-[240px]",
                toast.type === 'success' 
                  ? "bg-surface0 border-green/20 text-green" 
                  : "bg-surface0 border-red/20 text-red"
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium text-text">{toast.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-auto p-1 hover:bg-surface1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Status Bar */}
      {!isFullscreen && (
        <footer className="h-8 border-t border-surface0 bg-mantle flex items-center justify-between px-4 text-[10px] font-mono text-overlay0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
              Live Sync Active
            </span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Markdown v1.2</span>
            <span>Catppuccin Mocha</span>
          </div>
        </footer>
      )}
    </div>
  );
}


