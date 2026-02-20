import { useState } from 'react'
// In a full implementation, this component would receive the `selectedNodeId`
// and display controls matching the schema of that specific layer.
export function RightInspector({ selectedNodeId }: { selectedNodeId: string | null }) {
  const [activeTab, setActiveTab] = useState<'Layer' | 'Params' | 'Train' | 'Model'>('Layer')

  return (
    <div className="w-[300px] h-full bg-card border-l border-border flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex h-12 border-b border-border shrink-0">
        {['Layer', 'Params', 'Train', 'Model'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 flex items-center justify-center text-[13px] font-medium transition-colors relative ${
              activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute top-0 right-0 left-0 h-[2px] bg-primary"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {!selectedNodeId ? (
          <div className="flex flex-col items-center justify-center h-full text-center mt-12 opacity-60">
            <svg className="w-12 h-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <p className="text-sm font-medium text-foreground">Select a layer to view properties</p>
          </div>
        ) : (
          <div className="text-sm">
            <h3 className="font-semibold text-foreground mb-4 border-b border-border pb-2">Properties for {selectedNodeId}</h3>
            {/* Here we would render the specific parameter inputs based on the selected layer kind */}
            <p className="text-muted-foreground text-xs">Parameter controls have been moved here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
