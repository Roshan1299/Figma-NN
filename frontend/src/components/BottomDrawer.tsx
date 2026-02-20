import { useState } from 'react'

export function BottomDrawer() {
  const [activeTab, setActiveTab] = useState<'Drawing Canvas' | 'Figgy' | 'Logs'>('Drawing Canvas')
  
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[220px] bg-card/95 backdrop-blur-md border-t border-border flex flex-col shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-20">
      {/* Header Tabs */}
      <div className="flex items-center h-10 border-b border-border px-2">
        {(['Drawing Canvas', 'Figgy', 'Logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 mx-1 rounded-md text-[13px] font-medium transition-all flex items-center gap-2 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab === 'Drawing Canvas' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
            )}
            {tab === 'Figgy' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
            )}
            {tab === 'Logs' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            )}
            {tab}
          </button>
        ))}
        {/* Right side collapse icon placeholder */}
        <div className="ml-auto pr-2">
           <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex p-4 gap-6 overflow-hidden">
        {activeTab === 'Drawing Canvas' && (
          <>
            {/* Left Hand side: Tools and Canvas */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
                  Brush
                </button>
                <button className="flex items-center gap-1.5 bg-muted border border-border text-foreground hover:bg-muted/80 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4L20 11L11 20"></path><path d="M10 10L14 14"></path></svg>
                  Eraser
                </button>
                <button className="flex items-center gap-1.5 bg-muted border border-border text-foreground hover:bg-muted/80 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ml-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Clear
                </button>
              </div>
              
              <div className="flex-1 w-[200px] border border-border rounded-lg bg-background flex items-center justify-center opacity-80">
                <span className="text-muted-foreground text-xs">[ Canvas area ]</span>
              </div>
            </div>

            <div className="w-[1px] bg-border my-2"></div>

            {/* Right Hand side: Prediction */}
            <div className="flex gap-8 px-4 h-full items-center">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground mb-3">Quick Test</span>
                <div className="grid grid-cols-3 gap-2">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(char => (
                    <button key={char} className="w-8 h-8 rounded border border-border bg-muted/30 text-xs font-mono flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                      {char}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border border-primary/30 bg-primary/5 rounded-xl p-6 min-w-[140px] shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                <span className="text-xs text-muted-foreground mb-1">Prediction</span>
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-indigo-500 mb-2 font-mono">
                  A
                </span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground">Confidence:</span>
                  <span className="text-sm font-semibold text-cyan-400">92%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
