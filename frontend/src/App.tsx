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
          <header className="h-16 border-b border-gray-200 bg-white shadow-sm">
            <div className="h-full grid grid-cols-3 max-w-7xl mx-auto px-4 flex gap-8">
              <h1 className="text-xl flex items-center gap-2 font-bold text-gray-900"><img src="/kiwi.svg" alt="" className="h-6 w-6" />Stitch</h1>
                <nav className="flex gap-4 text-sm justify-center font-medium">
                <NavLink
                  to="/playground"
                  className="group flex items-center gap-2 hover:text-gray-600 transition-colors"
                >
                  <img src="/build.svg" alt="" className="h-4 w-4 transition-all group-hover:-rotate-45 group-hover:opacity-60" />
                  Build
                </NavLink>
                <NavLink
                  to="/models"
                  className="group flex items-center gap-2 hover:text-gray-600 transition-colors"
                >
                  <img src="/models.svg" alt="" className="h-4 w-4 transition-all group-hover:-translate-y-1 group-hover:opacity-60" />
                  Models
                </NavLink>
                <NavLink
                  to="/test"
                  className="group flex items-center gap-2 hover:text-gray-600 transition-colors"
                >
                  <img src="/test.svg" alt="" className="h-4 w-4 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-60" />
                  Test
                </NavLink>
                </nav>
              <div className="flex items-center justify-end">
                <CollabPresence />
              </div>
            </div>



            {/* Right Box: Avatars, Share, Gear */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 mr-2">
                <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white shrink-0 z-10">AL</div>
                <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white shrink-0 z-20">SM</div>
                <button className="w-7 h-7 rounded-full bg-muted border-2 border-border border-dashed flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground shrink-0 z-30 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
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
