import { useState, useEffect, useRef } from 'react'
import type { DragEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useVersionStore, type Version } from '@/store/versionStore'
import { useGraphStore, graphToArchitecture } from '@/store/graphStore'
import { ArchitecturePreview } from '@/components/ArchitecturePreview'

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
  batchnorm: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 6 18 3-9h4" /></svg>,
  residualblock: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16" /><path d="M4 12c0-4 4-7 8-7s8 3 8 7" /><polyline points="16 9 20 12 16 15" /></svg>,
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
      { id: 'residualblock', label: 'Residual Block', subtext: 'Conv + skip connection', kind: 'ResidualBlock', params: { filters: 64, kernel: 3 }, iconColor: '#a855f7' },
    ]
  },
  {
    name: 'Pooling',
    items: [
      { id: 'maxpool2d', label: 'MaxPool2D', subtext: 'Max pooling 2D', kind: 'Pooling', params: { type: 'max', pool_size: 2, stride: 2, padding: 0 }, iconColor: '#06b6d4' },
    ]
  },
  {
    name: 'Basic',
    items: [
      { id: 'dense', label: 'Dense', subtext: 'Fully connected', kind: 'Dense', params: { units: 128, activation: 'relu' }, iconColor: '#ef4444' },
      { id: 'flatten', label: 'Flatten', subtext: 'Flatten to 1D', kind: 'Flatten', params: {}, iconColor: '#f97316' },
      { id: 'batchnorm', label: 'Batch Norm', subtext: 'Normalize activations', kind: 'BatchNorm', params: {}, iconColor: '#14b8a6' },
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

// ── Icons ──────────────────────────────────────────────────────────────────────

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ── Relative time ──────────────────────────────────────────────────────────────

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

// ── HistoryPanel ───────────────────────────────────────────────────────────────

function HistoryPanel() {
  const { versions, saveVersion, deleteVersion, renameVersion } = useVersionStore()
  const { layers, edges, loadGraph } = useGraphStore()
  const [saveName, setSaveName] = useState('')
  const [confirmingRestoreId, setConfirmingRestoreId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  const handleSave = () => {
    const name = saveName.trim()
    if (!name) return
    saveVersion(name, layers, edges)
    setSaveName('')
  }

  const handleRestore = (version: Version) => {
    loadGraph(version.snapshot.layers, version.snapshot.edges)
    setConfirmingRestoreId(null)
  }

  const handleRenameSubmit = (id: string) => {
    const trimmed = renameValue.trim()
    if (trimmed) renameVersion(id, trimmed)
    setRenamingId(null)
  }

  const getArchitectureForPreview = (version: Version) => {
    try {
      return graphToArchitecture(version.snapshot.layers, version.snapshot.edges)
    } catch {
      return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Save section */}
      <div className="p-3 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSave() }}
            placeholder="Version name..."
            className="flex-1 bg-input/50 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder-muted-foreground"
          />
          <button
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            Save
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-3" />

      {/* Timeline header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Timeline</span>
        {versions.length > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {versions.length}
          </span>
        )}
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-4">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <ClockIcon className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground/60">No saved versions yet</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Save a snapshot to track your progress</p>
          </div>
        ) : (
          <div className="px-3">
            {versions.map((version, index) => {
              const isNewest = index === 0
              const isConfirming = confirmingRestoreId === version.id
              const isRenaming = renamingId === version.id
              const arch = getArchitectureForPreview(version)

              return (
                <div key={version.id} className="flex gap-2.5 group/card">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center shrink-0 pt-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 border-2"
                      style={{
                        borderColor: isNewest ? '#14b8a6' : '#404040',
                        backgroundColor: isNewest ? '#14b8a6' : 'transparent',
                      }}
                    />
                    {index < versions.length - 1 && (
                      <div className="w-px flex-1 bg-border/50 mt-1" />
                    )}
                  </div>

                  {/* Card */}
                  <div className="flex-1 mb-2 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 hover:border-border transition-all overflow-hidden min-w-0">
                    <div className="px-3 pt-2 pb-1">
                      {/* Name (double-click to rename) */}
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') handleRenameSubmit(version.id)
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                          onBlur={() => handleRenameSubmit(version.id)}
                          className="text-[13px] font-medium text-foreground bg-input/50 border border-primary rounded px-1.5 py-0.5 w-full focus:outline-none"
                        />
                      ) : (
                        <span
                          className="text-[13px] font-medium text-foreground/90 cursor-default block truncate"
                          onDoubleClick={() => {
                            setRenamingId(version.id)
                            setRenameValue(version.name)
                          }}
                          title="Double-click to rename"
                        >
                          {version.name}
                        </span>
                      )}

                      {/* Meta line */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{formatRelativeTime(version.timestamp)}</span>
                        <span className="text-[11px] text-muted-foreground/50">·</span>
                        <span className="text-[11px] text-muted-foreground">{version.layerCount} layers</span>
                      </div>
                    </div>

                    {/* Mini architecture preview */}
                    {arch && (
                      <div className="px-1 h-9 overflow-hidden">
                        <ArchitecturePreview architecture={arch} />
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="px-3 pb-2 pt-1 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleRestore(version)}
                            className="px-2 py-1 text-[11px] font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                          >
                            Confirm Restore
                          </button>
                          <button
                            onClick={() => setConfirmingRestoreId(null)}
                            className="px-2 py-1 text-[11px] font-medium rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setConfirmingRestoreId(version.id)}
                            className="px-2 py-1 text-[11px] font-medium rounded bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => deleteVersion(version.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                            title="Delete version"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main sidebar ───────────────────────────────────────────────────────────────

export type LeftSidebarTab = 'layers' | 'history'

interface LeftSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  activeTab?: LeftSidebarTab
  onTabChange?: (tab: LeftSidebarTab) => void
}

export function LeftSidebar({ collapsed, onToggleCollapse, activeTab: controlledTab, onTabChange }: LeftSidebarProps) {
  const [internalTab, setInternalTab] = useState<LeftSidebarTab>('layers')
  const activeTab = controlledTab ?? internalTab
  const setActiveTab = onTabChange ?? setInternalTab

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
      <div className="w-10 h-full flex flex-col items-center pt-3 gap-3 shrink-0" style={{ background: '#0a0a0a', borderRight: '1px solid #1e1e1e' }}>
        <button
          onClick={() => { onToggleCollapse(); setActiveTab('layers') }}
          title="Layers"
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            activeTab === 'layers' ? 'text-foreground bg-muted/60' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <LayersIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => { onToggleCollapse(); setActiveTab('history') }}
          title="Version History"
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            activeTab === 'history' ? 'text-foreground bg-muted/60' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-[260px] h-full flex flex-col shrink-0" style={{ background: '#0a0a0a', borderRight: '1px solid #1e1e1e' }}>
      {/* Header with tabs */}
      <div className="h-12 border-b border-border flex items-center px-2 shrink-0 justify-between">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'layers'
                ? 'text-foreground bg-muted/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <LayersIcon className="w-3.5 h-3.5" />
            <span className="text-[13px]">Layers</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-foreground bg-muted/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <ClockIcon className="w-3.5 h-3.5" />
            <span className="text-[13px]">History</span>
          </button>
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

      {activeTab === 'layers' ? (
        <>
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
        </>
      ) : (
        <HistoryPanel />
      )}
    </div>
  )
}
