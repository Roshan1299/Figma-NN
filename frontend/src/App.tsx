import '@xyflow/react/dist/style.css'
import { Toaster } from 'sonner'
import { BrowserRouter, Route, Routes, Navigate, Link } from 'react-router-dom'
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

const queryClient = new QueryClient()

function HeaderButtons() {
  const { layers, edges } = useGraphStore();
  
  // graphToArchitecture throws an error if there's no input layer (like on app start).
  // We need to catch this so we don't crash the entire React application in the header.
  let currentArchitecture = null;
  try {
    currentArchitecture = graphToArchitecture(layers, edges);
  } catch (e) {
    // Canvas is empty or invalid, currentArchitecture remains null
  }
  
  return (
    <>
      <Link 
        to="/marketplace" 
        className="bg-muted hover:bg-muted-foreground/20 text-foreground text-sm font-medium px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors border border-border"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        Marketplace
      </Link>
      <PublishToMarketplaceModal architecture={currentArchitecture || {}} />
    </>
  );
}

function HeaderLeft() {
  const { activeModelName, activeModelSource } = useMarketplaceStore();
  
  return (
    <div className="flex items-center gap-4">
      <Link to="/playground" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
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
      </Link>
      <div className="h-4 w-[1px] bg-border mx-1"></div>

      <button className="flex items-center gap-1 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 px-2 py-1 rounded transition-colors font-medium">
        File
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <button 
        onClick={() => {
          useGraphStore.getState().clearGraph();
          useMarketplaceStore.getState().clearActiveModel();
          import('./components/PresetChips').then(({ getPresetGraph }) => {
            const blank = getPresetGraph('blank');
            useGraphStore.getState().loadGraph(blank.layers, blank.edges);
          });
        }}
        className="flex items-center gap-1.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 px-2.5 py-1.5 rounded transition-colors font-medium border border-transparent hover:border-border ml-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        New
      </button>

      <div className="flex items-center gap-2 group cursor-default ml-3">
        <span className="text-[13px] font-medium text-foreground/90 relative">
          {activeModelName ? activeModelName : "Untitled Model"}
          {activeModelSource === 'marketplace' && (
            <sup className="ml-1 text-[9px] font-bold text-primary uppercase tracking-wide">
              Imported
            </sup>
          )}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="dark h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">
      <Toaster position="top-right" />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <header className="h-[52px] border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
            {/* Left: Logo and File dropdown */}
            <HeaderLeft />

            {/* Right: Presence, Share, Gear */}
            <div className="flex items-center gap-3">
              <HeaderButtons />
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
              <Route path="/marketplace" element={<MarketplaceList />} />
              <Route path="/marketplace/:id" element={<MarketplaceDetail />} />
            </Routes>
          </main>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  )
}
