import { useState } from 'react'
import type { DragEvent } from 'react'

const LAYER_GROUPS = [
  {
    name: 'Input Layers',
    // We adjust kind and params to mostly fit existing app logic or future extensions
    items: [
      { id: 'emnist', label: 'EMNIST Input', subtext: '28x28 grayscale', kind: 'Input', params: { dataset: 'emnist' }, iconColor: 'bg-emerald-500' },
      { id: 'audio', label: 'Audio Input', subtext: 'Waveform data', kind: 'Input', params: { dataset: 'audio' }, iconColor: 'bg-emerald-500' },
      { id: 'text', label: 'Text Input', subtext: 'Token sequences', kind: 'Input', params: { dataset: 'text' }, iconColor: 'bg-emerald-500' },
    ]
  },
  {
    name: 'Convolution',
    items: [
      { id: 'conv2d', label: 'Conv2D', subtext: '2D convolution', kind: 'Convolution', params: { filters: 32, kernel: 3, stride: 1, padding: 'same', activation: 'relu' }, iconColor: 'bg-blue-500' },
      { id: 'conv1d', label: 'Conv1D', subtext: '1D convolution', kind: 'Convolution', params: { filters: 32, kernel: 3, stride: 1, padding: 'same', activation: 'relu' }, iconColor: 'bg-blue-500' },
      { id: 'depthwise', label: 'Depthwise', subtext: 'Depthwise separable', kind: 'Convolution', params: { filters: 32, kernel: 3, stride: 1, padding: 'same', activation: 'relu' }, iconColor: 'bg-blue-500' },
    ]
  },
  {
    name: 'Pooling',
    items: [
      { id: 'maxpool2d', label: 'MaxPool2D', subtext: 'Max pooling 2D', kind: 'Pooling', params: { type: 'max', pool_size: 2, stride: 2, padding: 0 }, iconColor: 'bg-purple-500' },
    ]
  },
  {
    name: 'Recurrent',
    items: [
      { id: 'lstm', label: 'LSTM', subtext: 'Long short-term memory', kind: 'Dense', params: { units: 64, activation: 'tanh' }, iconColor: 'bg-yellow-500' },
    ]
  },
  {
    name: 'Basic',
    items: [
      { id: 'dense', label: 'Dense', subtext: 'Fully connected', kind: 'Dense', params: { units: 128, activation: 'relu' }, iconColor: 'bg-red-500' },
      { id: 'flatten', label: 'Flatten', subtext: 'Flatten to 1D', kind: 'Flatten', params: {}, iconColor: 'bg-orange-500' },
      { id: 'dropout', label: 'Dropout', subtext: 'Prevent overfitting', kind: 'Dropout', params: { rate: 0.2 }, iconColor: 'bg-rose-500' },
      { id: 'softmax', label: 'Softmax', subtext: '26 classes output', kind: 'Output', params: { classes: 26, activation: 'softmax' }, iconColor: 'bg-yellow-400' },
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

export function LeftSidebar() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Input Layers': true,
    'Convolution': true,
    'Pooling': false,
    'Recurrent': false,
  })

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <div className="w-[260px] h-full bg-card border-r border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-4 shrink-0">
        <svg className="w-4 h-4 text-muted-foreground mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <span className="font-semibold text-sm">Layer Library</span>
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
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${item.iconColor} bg-opacity-20 border border-${item.iconColor.split('-')[1]}-500/30 group-hover:bg-opacity-30 group-hover:-translate-y-[1px] transition-all`}>
                      <div className={`w-2.5 h-2.5 rounded-sm ${item.iconColor}`}></div>
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
