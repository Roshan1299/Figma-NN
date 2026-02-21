import { useState } from 'react'
import type { DragEvent } from 'react'

// SVG icons per layer id
const LAYER_ICONS: Record<string, (color: string) => React.ReactNode> = {
  mnist: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  emnist: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6M7 16h8"/></svg>,
  conv2d: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>,
  conv1d: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="2" y="8" width="5" height="8" rx="1"/><rect x="9" y="8" width="5" height="8" rx="1"/><rect x="16" y="8" width="6" height="8" rx="1"/></svg>,
  depthwise: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="3"/><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/></svg>,
  maxpool2d: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  dense: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="5" cy="6" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="9" r="2"/><circle cx="19" cy="15" r="2"/><path d="M7 6l10 3M7 12l10-3M7 12l10 3M7 18l10-3"/></svg>,
  flatten: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  dropout: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><line x1="9" y1="6" x2="15" y2="6" strokeDasharray="3 2"/><line x1="9" y1="18" x2="15" y2="18" strokeDasharray="3 2"/></svg>,
  softmax: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg>,
}

const LAYER_GROUPS = [
  {
    name: 'Input Layers',
    items: [
      { id: 'mnist', label: 'MNIST Input', subtext: 'Digits 0-9 · 28×28', kind: 'Input', params: { dataset: 'mnist' }, iconColor: '#10b981' },
      { id: 'emnist', label: 'EMNIST Input', subtext: 'Letters A-Z · 28×28', kind: 'Input', params: { dataset: 'emnist' }, iconColor: '#10b981' },
    ]
  },
  {
    name: 'Convolution',
    items: [
      { id: 'conv2d', label: 'Conv2D', subtext: '2D convolution', kind: 'Convolution', params: { filters: 32, kernel: 3, stride: 1, padding: 'same', activation: 'relu' }, iconColor: '#3b82f6' },
    ]
  },
  {
    name: 'Pooling',
    items: [
      { id: 'maxpool2d', label: 'MaxPool2D', subtext: 'Max pooling 2D', kind: 'Pooling', params: { type: 'max', pool_size: 2, stride: 2, padding: 0 }, iconColor: '#a855f7' },
    ]
  },
  {
    name: 'Basic',
    items: [
      { id: 'dense', label: 'Dense', subtext: 'Fully connected', kind: 'Dense', params: { units: 128, activation: 'relu' }, iconColor: '#ef4444' },
      { id: 'flatten', label: 'Flatten', subtext: 'Flatten to 1D', kind: 'Flatten', params: {}, iconColor: '#f97316' },
      { id: 'dropout', label: 'Dropout', subtext: 'Prevent overfitting', kind: 'Dropout', params: { rate: 0.2 }, iconColor: '#f43f5e' },
      { id: 'softmax', label: 'Softmax Output', subtext: 'Classification head', kind: 'Output', params: { classes: 26, activation: 'softmax' }, iconColor: '#eab308' },
    ]
  }
]

function createDragStartHandler(template: any) {
  return (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(
      'application/layer-template',
      JSON.stringify({
        kind: template.kind,
        params: template.params,
      })
    )
  }
}

export function LeftSidebar({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Input Layers': true,
    'Convolution': true,
    'Pooling': false,
    'Recurrent': false,
  })

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }))
  }

  if (collapsed) {
    return (
      <div className="w-10 h-full bg-card border-r border-border flex flex-col items-center pt-3 gap-3 shrink-0">
        <button
          onClick={onToggleCollapse}
          title="Expand panel"
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </div>
    )
  }

  return (
    <div className="w-[260px] h-full bg-card border-r border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-muted-foreground mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <span className="font-semibold text-sm">Layer Library</span>
        </div>
        <button
          onClick={onToggleCollapse}
          title="Collapse panel"
          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search layers..." 
            className="w-full bg-input/50 border border-border rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-4">
        {LAYER_GROUPS.map((group) => (
          <div key={group.name} className="flex flex-col">
            <button 
              onClick={() => toggleGroup(group.name)}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-3 h-3 text-muted-foreground transition-transform ${openGroups[group.name] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs font-semibold text-foreground/90 group-hover:text-foreground">{group.name}</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{group.items.length}</span>
            </button>
            
            {openGroups[group.name] && (
              <div className="flex flex-col gap-1 px-2 pb-2">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={createDragStartHandler(item)}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/60 cursor-grab active:cursor-grabbing group transition-all border border-transparent hover:border-border/50 hover:shadow-sm"
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      {LAYER_ICONS[item.id]?.(item.iconColor) ?? (
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.iconColor }} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-foreground/90 leading-tight group-hover:text-foreground">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground leading-tight mt-0.5 group-hover:text-muted-foreground/90">{item.subtext}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Chips */}
      <div className="p-4 border-t border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-muted-foreground font-medium">Recent</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-muted border border-border text-foreground/80 hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors">Conv2D</div>
          <div className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-muted border border-border text-foreground/80 hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors">ReLU</div>
          <div className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-muted border border-border text-foreground/80 hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors">Dense</div>
        </div>
      </div>
    </div>
  )
}
