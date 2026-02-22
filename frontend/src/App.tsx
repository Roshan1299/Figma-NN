import '@xyflow/react/dist/style.css'
import { Toaster } from 'sonner'
import { BrowserRouter, Route, Routes, Navigate, Link } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import Playground from './routes/Playground'
import Models from './routes/Models'
import ModelPage from './routes/Model'
import Test from './routes/Test'
import MarketplaceList from './routes/MarketplaceList'
import MarketplaceDetail from './routes/MarketplaceDetail'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CollabPresence } from './components/CollabPresence'
import { PublishToMarketplaceModal } from './components/PublishToMarketplaceModal'
import { useGraphStore, graphToArchitecture } from './store/graphStore'
import { useMarketplaceStore } from './store/marketplaceStore'
import { generatePyTorchCode } from './lib/codeGenerator'

const queryClient = new QueryClient()

function ShareDropdown() {
  const [open, setOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const { layers, edges } = useGraphStore()

  let currentArchitecture: Record<string, any> = {}
  try {
    currentArchitecture = graphToArchitecture(layers, edges)
  } catch {
    // empty canvas
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const captureCanvas = useCallback(async (): Promise<string | null> => {
    const el = document.querySelector('.react-flow') as HTMLElement | null
    if (!el) return null
    try {
      // Compute bounding box of all visible nodes relative to the canvas element
      const nodeEls = el.querySelectorAll('.react-flow__node')
      const containerRect = el.getBoundingClientRect()

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      nodeEls.forEach((nodeEl) => {
        const rect = (nodeEl as HTMLElement).getBoundingClientRect()
        const relX = rect.left - containerRect.left
        const relY = rect.top - containerRect.top
        minX = Math.min(minX, relX)
        minY = Math.min(minY, relY)
        maxX = Math.max(maxX, relX + rect.width)
        maxY = Math.max(maxY, relY + rect.height)
      })

      const filter = (node: HTMLElement) => {
        const cls = node.className ?? ''
        if (typeof cls === 'string' && (cls.includes('react-flow__controls') || cls.includes('react-flow__minimap'))) return false
        return true
      }

      // No nodes — capture whatever is visible
      if (minX === Infinity) {
        return await toPng(el, { backgroundColor: '#0a0a0a', pixelRatio: 1.5, filter })
      }

      // Crop tightly around nodes with padding
      const padding = 48
      const cropX = Math.max(0, minX - padding)
      const cropY = Math.max(0, minY - padding)
      const cropW = Math.min(containerRect.width - cropX, maxX - minX + padding * 2)
      const cropH = Math.min(containerRect.height - cropY, maxY - minY + padding * 2)

      return await toPng(el, {
        backgroundColor: '#0a0a0a',
        pixelRatio: 2,
        width: cropW,
        height: cropH,
        style: {
          transform: `translate(-${cropX}px, -${cropY}px)`,
          transformOrigin: 'top left',
          width: `${containerRect.width}px`,
          height: `${containerRect.height}px`,
        },
        filter,
      })
    } catch {
      return null
    }
  }, [])

  function handleDownloadPy() {
    setOpen(false)
    const code = generatePyTorchCode(layers, edges)
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'model.py'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handlePublish() {
    setOpen(false)
    const img = await captureCanvas()
    setPreviewImage(img)
    setPublishOpen(true)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="bg-muted hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-foreground text-sm font-medium px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors border border-border"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden py-1">
          <button
            onClick={handlePublish}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div>
              <div className="font-medium">Publish to Marketplace</div>
              <div className="text-[11px] text-muted-foreground">Share with the community</div>
            </div>
          </button>

          <div className="h-px bg-border mx-2" />

          <button
            onClick={handleDownloadPy}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 shrink-0">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <div>
              <div className="font-medium">Download .py</div>
              <div className="text-[11px] text-muted-foreground">Export PyTorch code</div>
            </div>
          </button>
        </div>
      )}

      <PublishToMarketplaceModal
        architecture={currentArchitecture}
        previewImage={previewImage}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
      />
    </div>
  )
}

function HeaderLeft() {
  const activeModelName = useMarketplaceStore(s => s.activeModelName)
  const activeModelSource = useMarketplaceStore(s => s.activeModelSource)

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/playground"
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => {
          useGraphStore.getState().clearGraph()
          useMarketplaceStore.getState().clearActiveModel()
          import('./components/PresetChips').then(({ getPresetGraph }) => {
            const blank = getPresetGraph('blank')
            useGraphStore.getState().loadGraph(blank.layers, blank.edges)
          })
        }}
      >
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>
        <span className="font-semibold text-foreground text-sm tracking-wide">FigmaNN</span>
      </Link>
      {activeModelSource === 'marketplace' && activeModelName && (
        <>
          <span className="text-border mx-1">/</span>
          <div className="flex items-start">
            <span className="text-sm text-foreground font-medium leading-none translate-y-[2px]">
              {activeModelName}
            </span>
            <span className="text-[8px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 rounded px-1 py-0.5 leading-none tracking-wide ml-1.5 -translate-y-[4px]">
              IMPORTED
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <div className="dark h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">
      <Toaster position="top-right" />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <header className="h-[52px] border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
            <HeaderLeft />

            <div className="flex items-center gap-3">
              <Link
                to="/marketplace"
                className="bg-muted hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-foreground text-sm font-medium px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors border border-border"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                Marketplace
              </Link>
              <ShareDropdown />
              <CollabPresence />
              <button className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors p-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
            </div>
          </header>

          <main className="flex-1 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/playground" replace />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/playground/:id" element={<Playground />} />
              <Route path="/code" element={<Playground />} />
              <Route path="/hybrid" element={<Playground />} />
              <Route path="/models" element={<Models />} />
              <Route path="/models/:id" element={<ModelPage />} />
              <Route path="/test" element={<Test />} />
              <Route path="/test/:modelId" element={<Test />} />
              <Route path="/marketplace" element={<MarketplaceList />} />
              <Route path="/marketplace/:id" element={<MarketplaceDetail />} />
            </Routes>
          </main>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  )
}
