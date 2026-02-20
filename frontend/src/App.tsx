import '@xyflow/react/dist/style.css'
import { Toaster } from 'sonner'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Playground from './routes/Playground'
import Models from './routes/Models'
import ModelPage from './routes/Model'
import Test from './routes/Test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CollabPresence } from './components/CollabPresence'

const queryClient = new QueryClient()

export default function App() {
  return (
    <div className="dark h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">
      <Toaster position="top-right" />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <header className="h-[52px] border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
            {/* Left: Logo and File dropdown */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </div>
                <span className="font-semibold text-foreground text-sm tracking-wide">FigmaNN</span>
              </div>
              <div className="h-4 w-[1px] bg-border mx-1"></div>
              <button className="flex items-center gap-1 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 px-2 py-1 rounded transition-colors font-medium">
                File
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            {/* Right: Presence, Share, Gear */}
            <div className="flex items-center gap-3">
              <CollabPresence />
              <button className="bg-muted hover:bg-muted-foreground/20 text-foreground text-sm font-medium px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors border border-border">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                Share
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
            </div>
          </header>

          <main className="flex-1 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/playground" replace />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/code" element={<Playground />} />
              <Route path="/hybrid" element={<Playground />} />
              <Route path="/models" element={<Models />} />
              <Route path="/models/:id" element={<ModelPage />} />
              <Route path="/test" element={<Test />} />
              <Route path="/test/:modelId" element={<Test />} />
            </Routes>
          </main>
        </BrowserRouter>

      </QueryClientProvider>
    </div>
  )
}
