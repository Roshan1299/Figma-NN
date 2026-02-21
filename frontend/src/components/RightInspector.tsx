import { useState, useMemo, useEffect, useRef } from 'react'
import type { FC } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { MetricsCharts } from './MetricsCharts'
import { SamplePredictionCard } from './SamplePredictionCard'
import type { MetricData, EmnistSample } from '@/api/types'
import { useGraphStore } from '@/store/graphStore'
import { useModels, useModel } from '@/hooks/useModels'
import type { AnyLayer, TensorShape } from '@/types/graph'

interface RightInspectorProps {
  selectedNodeId: string | null
  collapsed: boolean
  onToggleCollapse: () => void
  isTraining: boolean
  metrics: MetricData[]
  currentState: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | null
  runId?: string
  samplePredictions?: EmnistSample[]
  datasetType?: 'mnist' | 'emnist' | 'audio' | 'text'
  onCancel?: () => void
  canCancel?: boolean
  isCancelling?: boolean
}

type ActiveTab = 'props' | 'metrics' | 'model'

// ── Shared dark-style input primitives ───────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-medium mb-2" style={{ color: '#aaa' }}>
      {children}
    </p>
  )
}

function DarkInput({ value, onChange, min, max, step = 1 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v) }}
      className="w-full rounded-xl px-4 py-3 text-[15px] font-medium text-white outline-none focus:ring-1 focus:ring-[#3ecfcf]/40 transition-all"
      style={{ background: '#1c1c1e', border: '1px solid #2a2a2e' }}
    />
  )
}

function DarkSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-[15px] font-medium text-white outline-none appearance-none cursor-pointer transition-all focus:ring-1 focus:ring-[#3ecfcf]/40 pr-10"
        style={{ background: '#1c1c1e', border: '1px solid #2a2a2e' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

// ── Format shape for display ──────────────────────────────────────────────────

function shapeToDisplay(shape?: TensorShape): string {
  if (!shape) return '—'
  if (shape.type === 'vector') return `(${shape.size})`
  if (shape.type === 'image') return `(${shape.height}, ${shape.width}, ${shape.channels})`
  return '—'
}

// ── Layer Props Editor ────────────────────────────────────────────────────────

function LayerPropsEditor({ layer, onUpdate, inputShape }: {
  layer: AnyLayer
  onUpdate: (params: Record<string, any>) => void
  inputShape?: TensorShape
}) {
  const ACTIVATION_OPTIONS = [
    { value: 'relu', label: 'ReLU' },
    { value: 'sigmoid', label: 'Sigmoid' },
    { value: 'tanh', label: 'Tanh' },
    { value: 'none', label: 'None' },
  ]

  const shapeBlock = (
    <div className="mt-6 pt-5" style={{ borderTop: '1px solid #2a2a2e' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#555' }}>
        Input / Output Shape
      </p>
      <div
        className="flex items-center justify-around rounded-xl p-4"
        style={{ border: '1.5px dashed #2a2a2e', background: '#111' }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>In</span>
          <span className="font-mono text-[13px]" style={{ color: '#ccc' }}>
            {shapeToDisplay(inputShape)}
          </span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Out</span>
          <span className="font-mono text-[13px]" style={{ color: '#ccc' }}>
            {shapeToDisplay(layer.shapeOut)}
          </span>
        </div>
      </div>
    </div>
  )

  if (layer.kind === 'Input') {
    return (
      <div className="space-y-4">
        <Field label="Dataset">
          <DarkSelect
            value={layer.params.dataset ?? 'mnist'}
            onChange={v => onUpdate({ dataset: v })}
            options={[
              { value: 'mnist', label: 'MNIST (digits 0-9)' },
              { value: 'emnist', label: 'EMNIST (letters A-Z)' },
            ]}
          />
        </Field>
        {shapeBlock}
      </div>
    )
  }

  if (layer.kind === 'Dense') {
    return (
      <div className="space-y-4">
        <Field label="Units">
          <DarkInput value={layer.params.units} onChange={v => onUpdate({ units: v })} min={1} max={4096} />
        </Field>
        <Field label="Activation">
          <DarkSelect value={layer.params.activation} onChange={v => onUpdate({ activation: v })} options={ACTIVATION_OPTIONS} />
        </Field>
        {shapeBlock}
      </div>
    )
  }

  if (layer.kind === 'Convolution') {
    return (
      <div className="space-y-4">
        <Field label="Filters">
          <DarkInput value={layer.params.filters} onChange={v => onUpdate({ filters: v })} min={1} max={512} />
        </Field>
        <Field label="Kernel Size">
          <div className="grid grid-cols-2 gap-2">
            <DarkInput value={layer.params.kernel} onChange={v => onUpdate({ kernel: v })} min={1} max={11} />
            <DarkInput value={layer.params.kernel} onChange={v => onUpdate({ kernel: v })} min={1} max={11} />
          </div>
        </Field>
        <Field label="Stride">
          <DarkInput value={layer.params.stride} onChange={v => onUpdate({ stride: v })} min={1} max={4} />
        </Field>
        <Field label="Padding">
          <DarkSelect
            value={layer.params.padding}
            onChange={v => onUpdate({ padding: v })}
            options={[{ value: 'same', label: 'Same' }, { value: 'valid', label: 'Valid' }]}
          />
        </Field>
        <Field label="Activation">
          <DarkSelect value={layer.params.activation} onChange={v => onUpdate({ activation: v })} options={ACTIVATION_OPTIONS} />
        </Field>
        {shapeBlock}
      </div>
    )
  }

  if (layer.kind === 'Pooling') {
    return (
      <div className="space-y-4">
        <Field label="Pool Size">
          <DarkInput value={layer.params.pool_size} onChange={v => onUpdate({ pool_size: v })} min={1} max={8} />
        </Field>
        <Field label="Stride">
          <DarkInput value={layer.params.stride} onChange={v => onUpdate({ stride: v })} min={1} max={4} />
        </Field>
        {shapeBlock}
      </div>
    )
  }

  if (layer.kind === 'Dropout') {
    return (
      <div className="space-y-4">
        <Field label="Dropout Rate">
          <DarkInput
            value={layer.params.rate}
            onChange={v => onUpdate({ rate: Math.min(0.99, Math.max(0, v)) })}
            min={0} max={0.99} step={0.05}
          />
        </Field>
        <div className="rounded-xl overflow-hidden h-1.5" style={{ background: '#1c1c1e' }}>
          <div
            className="h-full transition-all"
            style={{ width: `${(layer.params.rate ?? 0.2) * 100}%`, background: '#f43f5e' }}
          />
        </div>
        <p className="text-[12px]" style={{ color: '#666' }}>
          {((layer.params.rate ?? 0.2) * 100).toFixed(0)}% of neurons dropped during training
        </p>
        {shapeBlock}
      </div>
    )
  }

  if (layer.kind === 'Output') {
    return (
      <div className="space-y-4">
        <Field label="Classes">
          <DarkInput value={layer.params.classes} onChange={v => onUpdate({ classes: v })} min={2} max={1000} />
        </Field>
        <Field label="Activation">
          <DarkSelect
            value={layer.params.activation}
            onChange={v => onUpdate({ activation: v })}
            options={[{ value: 'softmax', label: 'Softmax' }]}
          />
        </Field>
        {shapeBlock}
      </div>
    )
  }

  if (layer.kind === 'Flatten') {
    return (
      <div>
        <div className="rounded-xl px-4 py-3 text-[13px] mb-4" style={{ background: '#1c1c1e', color: '#666' }}>
          No configurable parameters — reshapes input to 1D.
        </div>
        {shapeBlock}
      </div>
    )
  }

  return null
}

// ── Metrics helpers ───────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
}

const STATUS_COLOR: Record<string, string> = {
  running: '#60a5fa', succeeded: '#34d399', failed: '#f87171',
  cancelled: '#888', queued: '#fbbf24',
}
const STATUS_LABEL: Record<string, string> = {
  running: 'Training…', succeeded: 'Completed', failed: 'Failed',
  cancelled: 'Cancelled', queued: 'Queued',
}

function DarkMetricCard({ label, value, format = 'number', color, trend, decimals = 4 }: {
  label: string; value: number; format?: 'number' | 'pct'; color: string
  trend?: 'good' | 'bad' | 'neutral'; decimals?: number
}) {
  const display = format === 'pct' ? `${(value * 100).toFixed(2)}%` : value.toFixed(decimals)
  return (
    <div className="rounded-xl p-3" style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
      <p className="text-[10px] mb-1" style={{ color: '#666' }}>{label}</p>
      <p className="text-base font-bold font-mono flex items-center gap-1" style={{ color }}>
        {display}
        {trend === 'good' && <span style={{ color: '#34d399', fontSize: 10 }}>↑</span>}
        {trend === 'bad' && <span style={{ color: '#f87171', fontSize: 10 }}>↓</span>}
      </p>
    </div>
  )
}

// ── Collapsed strip ───────────────────────────────────────────────────────────

function CollapsedStrip({ onToggle, setTab, isTraining }: {
  onToggle: () => void
  setTab: (t: ActiveTab) => void
  isTraining: boolean
}) {
  return (
    <div className="w-10 h-full flex flex-col items-center pt-3 gap-3 shrink-0" style={{ background: '#0a0a0a', borderLeft: '1px solid #1e1e1e' }}>
      <button onClick={onToggle} className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/10" style={{ color: '#555' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button onClick={() => { setTab('props'); onToggle() }} title="Props" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#555' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
      <button onClick={() => { setTab('metrics'); onToggle() }} title="Metrics" className="relative w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#555' }}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
        {isTraining && <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
      </button>
      <button onClick={() => { setTab('model'); onToggle() }} title="Model" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#555' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </button>
    </div>
  )
}

// ── Model Tab ─────────────────────────────────────────────────────────────────
import type { StoredModel } from '@/hooks/useModels'

const KIND_COLOR: Record<string, string> = {
  Input: '#10b981', Dense: '#ef4444', Conv2D: '#3b82f6', Linear: '#ef4444',
  Flatten: '#f97316', Dropout: '#f43f5e', Output: '#eab308', MaxPool2D: '#a855f7',
}

function ModelCard({ model }: { model: StoredModel }) {
  const [expanded, setExpanded] = useState(false)
  // Fetch full model data (with runs + metrics) only when expanded
  const { data: fullModel } = useModel(expanded ? model.model_id : undefined)
  const runs = fullModel?.runs ?? model.runs ?? []
  const bestRun = runs.reduce<typeof runs[0] | null>((best, r) => {
    const acc = r.metrics.at(-1)?.val_accuracy ?? 0
    const bestAcc = best ? (best.metrics.at(-1)?.val_accuracy ?? 0) : 0
    return acc > bestAcc ? r : best
  }, null)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
      {/* Header row — click to expand */}
      <button
        className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-white/5"
        style={{ background: '#111' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-semibold text-white truncate">{model.name}</span>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: '#555' }}>
            {model.architecture?.layers && <span>{model.architecture.layers.length} layers</span>}
            {model.runs_total !== undefined && <span>{model.runs_total} run{model.runs_total !== 1 ? 's' : ''}</span>}
            {model.created_at && <span>{new Date(model.created_at).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {model.highest_accuracy !== undefined && (
            <span className="text-[12px] font-mono font-bold" style={{ color: '#34d399' }}>
              {(model.highest_accuracy * 100).toFixed(1)}%
            </span>
          )}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3" style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a' }}>
          {/* Architecture layers */}
          {model.architecture?.layers && model.architecture.layers.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#444' }}>Architecture</p>
              <div className="space-y-1">
                {model.architecture.layers.map((l, i) => {
                  const color = KIND_COLOR[l.type] ?? '#666'
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
                      <span className="font-mono" style={{ color: '#888' }}>{l.type}</span>
                      {l.out !== undefined && (
                        <span className="ml-auto font-mono" style={{ color: '#555' }}>{l.out}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Best run metrics + charts */}
          {bestRun && bestRun.metrics.length > 0 && (() => {
            const last = bestRun.metrics.at(-1)!
            return (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest" style={{ color: '#444' }}>Best Run</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Val Acc', value: `${(last.val_accuracy * 100).toFixed(1)}%`, color: '#a78bfa' },
                    { label: 'Val Loss', value: last.val_loss.toFixed(4), color: '#60a5fa' },
                    { label: 'Epochs', value: String(last.epoch), color: '#888' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg px-2 py-2" style={{ background: '#1a1a1a' }}>
                      <p className="text-[10px] mb-0.5" style={{ color: '#555' }}>{label}</p>
                      <p className="text-[11px] font-mono font-semibold" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
                {bestRun.metrics.length > 1 && (
                  <MetricsCharts metrics={bestRun.metrics} />
                )}
              </div>
            )
          })()}

          {/* Hyperparams */}
          {bestRun?.hyperparams && (
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#444' }}>Hyperparams</p>
              <div className="space-y-1">
                {(['epochs', 'batch_size', 'optimizer', 'learning_rate'] as const).map(k => {
                  const v = bestRun.hyperparams?.[k]
                  if (v === undefined) return null
                  return (
                    <div key={k} className="flex items-center justify-between text-[11px]">
                      <span style={{ color: '#555' }}>{k.replace('_', ' ')}</span>
                      <span className="font-mono" style={{ color: '#888' }}>{String(v)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModelTab({ savedModels, isLoading }: { savedModels: StoredModel[]; isLoading: boolean }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <div className="flex items-center justify-between mb-4 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#444' }}>Saved Models</p>
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#1c1c1e', color: '#555' }}>
          {savedModels.length}
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: '#333' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {!isLoading && savedModels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
          <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="#555" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-[13px]" style={{ color: '#555' }}>No saved models yet.</p>
          <p className="text-[11px] mt-1" style={{ color: '#3a3a3a' }}>Train and save a model to see it here.</p>
        </div>
      )}

      {!isLoading && savedModels.length > 0 && (
        <div className="space-y-2">
          {savedModels.map(model => (
            <ModelCard key={model.model_id} model={model} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const RightInspector: FC<RightInspectorProps> = ({
  selectedNodeId,
  collapsed,
  onToggleCollapse,
  isTraining,
  metrics,
  currentState,
  runId,
  samplePredictions = [],
  datasetType = 'mnist',
  onCancel,
  canCancel = false,
  isCancelling = false,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('props')
  const [modelName, setModelName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedModelId, setSavedModelId] = useState<string | null>(null)

  const { layers, edges, updateLayerParams } = useGraphStore()
  const { data: savedModels, isLoading: modelsLoading } = useModels()
  const queryClient = useQueryClient()
  const selectedLayer = selectedNodeId ? layers[selectedNodeId] : null

  // Find input shape for selected layer (from the edge that connects into it)
  const inputShape = useMemo((): TensorShape | undefined => {
    if (!selectedNodeId) return undefined
    const incoming = edges.find(e => e.target === selectedNodeId)
    if (!incoming) return undefined
    const sourceLayer = layers[incoming.source]
    return sourceLayer?.shapeOut
  }, [selectedNodeId, edges, layers])

  // Throttled metrics
  const [throttledMetrics, setThrottledMetrics] = useState<MetricData[]>(metrics)
  const lastUpdateRef = useRef<number>(0)
  useEffect(() => {
    const now = Date.now()
    if (metrics.length === 1 || now - lastUpdateRef.current >= 500) {
      setThrottledMetrics(metrics)
      lastUpdateRef.current = now
    } else {
      const t = setTimeout(() => {
        setThrottledMetrics(metrics)
        lastUpdateRef.current = Date.now()
      }, 500 - (now - lastUpdateRef.current))
      return () => clearTimeout(t)
    }
  }, [metrics, metrics.length])

  // Auto-switch tabs
  useEffect(() => {
    if (isTraining || (metrics.length > 0 && currentState !== null)) setActiveTab('metrics')
  }, [isTraining, metrics.length, currentState])

  useEffect(() => {
    if (selectedNodeId && !isTraining) setActiveTab('props')
  }, [selectedNodeId, isTraining])

  useEffect(() => {
    setSavedModelId(null)
    setModelName('')
  }, [runId])

  const latestMetric = throttledMetrics.at(-1) ?? null

  const trends = useMemo(() => {
    const latest = throttledMetrics.at(-1)
    const prev = throttledMetrics.at(-2)
    if (!latest || !prev) return { trainLoss: 'neutral', valLoss: 'neutral', trainAcc: 'neutral', valAcc: 'neutral' } as const
    return {
      trainLoss: latest.train_loss < prev.train_loss ? 'good' : 'bad',
      valLoss: latest.val_loss < prev.val_loss ? 'good' : 'bad',
      trainAcc: latest.train_accuracy > prev.train_accuracy ? 'good' : 'bad',
      valAcc: latest.val_accuracy > prev.val_accuracy ? 'good' : 'bad',
    }
  }, [throttledMetrics])

  const isOverfitting = latestMetric ? (latestMetric.train_accuracy - latestMetric.val_accuracy) > 0.1 : false

  const handleSaveModel = async () => {
    if (!runId || !modelName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/models/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId, name: modelName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setSavedModelId(data.model_id)
        setModelName('')
        // Immediately refresh the models list in the Model tab
        await queryClient.invalidateQueries({ queryKey: ['models'] })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const hasTrainingData = metrics.length > 0 || currentState !== null

  // ── Tab icons ──────────────────────────────────────────────────────────────
  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'props',
      label: 'Props',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    },
    {
      id: 'metrics',
      label: 'Metrics',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      id: 'model',
      label: 'Model',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    },
  ]

  if (collapsed) {
    return <CollapsedStrip onToggle={onToggleCollapse} setTab={setActiveTab} isTraining={isTraining} />
  }

  return (
    <div className="w-[300px] h-full flex flex-col shrink-0 overflow-hidden" style={{ background: '#0a0a0a', borderLeft: '1px solid #1e1e1e' }}>
      {/* Tab bar */}
      <div className="p-3 shrink-0">
        <div className="flex rounded-xl p-1 gap-0.5" style={{ background: '#161618' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg h-8 text-[12px] font-medium transition-all"
              style={
                activeTab === tab.id
                  ? { background: '#252528', color: '#fff' }
                  : { color: '#555' }
              }
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'metrics' && isTraining && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </button>
          ))}
          {/* Collapse button */}
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors ml-0.5"
            style={{ color: '#444' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* ── Props Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'props' && (
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {!selectedLayer ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 opacity-40">
              <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="#555" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <p className="text-[13px]" style={{ color: '#555' }}>Select a layer to edit its properties</p>
            </div>
          ) : (
            <>
              {/* Layer header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[20px] font-bold text-white">{selectedLayer.kind} Layer</h2>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: '#444' }}>{selectedLayer.id}</p>
                </div>
                <span
                  className="text-[11px] font-semibold px-3 py-1 rounded-full"
                  style={{ background: '#0d3d3d', color: '#3ecfcf', border: '1px solid #1a5555' }}
                >
                  Active
                </span>
              </div>

              <LayerPropsEditor
                layer={selectedLayer}
                onUpdate={params => updateLayerParams(selectedLayer.id, params)}
                inputShape={inputShape}
              />
            </>
          )}
        </div>
      )}

      {/* ── Metrics Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'metrics' && (
        <div className="flex-1 overflow-y-auto">
          {!hasTrainingData ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-40">
              <svg className="w-10 h-10 mb-3" viewBox="0 0 20 20" fill="#555">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <p className="text-[13px]" style={{ color: '#555' }}>Train a model to see live metrics here.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isTraining && (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: '#60a5fa' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span className="text-[13px] font-semibold" style={{ color: STATUS_COLOR[currentState ?? ''] ?? '#888' }}>
                    {STATUS_LABEL[currentState ?? ''] ?? 'Idle'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {runId && <span className="text-[10px] font-mono truncate max-w-[100px]" style={{ color: '#444' }}>{runId.slice(0, 8)}</span>}
                  {canCancel && onCancel && (
                    <button
                      onClick={onCancel}
                      disabled={isCancelling}
                      className="text-[11px] px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                      style={{ border: '1px solid #2a2a2e', color: '#888' }}
                    >
                      {isCancelling ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress */}
              {latestMetric?.progress !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs" style={{ color: '#555' }}>
                    <span>Epoch {latestMetric.epoch}</span>
                    <div className="flex items-center gap-2">
                      {latestMetric.eta_seconds !== undefined && latestMetric.eta_seconds > 0 && (
                        <span className="font-mono">ETA {formatTime(latestMetric.eta_seconds)}</span>
                      )}
                      <span className="font-mono">{(latestMetric.progress * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: '#1c1c1e' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${latestMetric.progress * 100}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                    />
                  </div>
                </div>
              )}

              {isOverfitting && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ border: '1px solid #78350f44', background: '#78350f22' }}>
                  <span style={{ color: '#fbbf24', fontSize: 12 }}>⚠</span>
                  <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>Potential overfitting detected</span>
                </div>
              )}

              {latestMetric && (
                <div className="grid grid-cols-2 gap-2">
                  <DarkMetricCard label="Train Loss" value={latestMetric.train_loss} trend={trends.trainLoss} color="#f87171" decimals={4} />
                  <DarkMetricCard label="Val Loss" value={latestMetric.val_loss} trend={trends.valLoss} color="#60a5fa" decimals={4} />
                  <DarkMetricCard label="Train Acc" value={latestMetric.train_accuracy} format="pct" trend={trends.trainAcc} color="#34d399" />
                  <DarkMetricCard label="Val Acc" value={latestMetric.val_accuracy} format="pct" trend={trends.valAcc} color="#a78bfa" />
                </div>
              )}

              {throttledMetrics.length > 1 && <MetricsCharts metrics={throttledMetrics} />}

              {currentState === 'succeeded' && !savedModelId && (
                <div className="space-y-2 p-3 rounded-xl" style={{ border: '1px solid #06543044', background: '#06543022' }}>
                  <p className="text-xs font-semibold" style={{ color: '#34d399' }}>Training complete — save your model</p>
                  <div className="flex gap-2">
                    <input
                      placeholder="Model name…"
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveModel()}
                      className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      style={{ background: '#1c1c1e', border: '1px solid #2a2a2e' }}
                    />
                    <button
                      onClick={handleSaveModel}
                      disabled={!modelName.trim() || isSaving}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: '#065f46', color: '#34d399' }}
                    >
                      {isSaving ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {savedModelId && (
                <div className="p-3 rounded-xl" style={{ border: '1px solid #06543044', background: '#06543022' }}>
                  <p className="text-xs font-semibold" style={{ color: '#34d399' }}>Model saved! View it in the Model tab.</p>
                </div>
              )}

              {throttledMetrics.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#444' }}>History</p>
                  <div className="max-h-44 overflow-y-auto rounded-xl" style={{ border: '1px solid #1e1e1e', background: '#0d0d0d' }}>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                          <th className="px-2 py-1.5 text-left font-medium" style={{ color: '#444' }}>Ep</th>
                          <th className="px-2 py-1.5 text-right font-medium" style={{ color: '#444' }}>Loss</th>
                          <th className="px-2 py-1.5 text-right font-medium" style={{ color: '#444' }}>Val Loss</th>
                          <th className="px-2 py-1.5 text-right font-medium" style={{ color: '#444' }}>Val Acc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {throttledMetrics.slice().reverse().map((m, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1a1a1a', background: i === 0 ? '#1a1a2e' : undefined }}>
                            <td className="px-2 py-1 font-mono" style={{ color: '#666' }}>{m.epoch}</td>
                            <td className="px-2 py-1 text-right font-mono" style={{ color: '#f87171aa' }}>{m.train_loss.toFixed(4)}</td>
                            <td className="px-2 py-1 text-right font-mono" style={{ color: '#60a5faaa' }}>{m.val_loss.toFixed(4)}</td>
                            <td className="px-2 py-1 text-right font-mono" style={{ color: '#a78bfaaa' }}>{(m.val_accuracy * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {samplePredictions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#444' }}>Predictions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {samplePredictions.slice(0, 4).map((sample, i) => (
                      <SamplePredictionCard key={i} sample={sample} datasetType={datasetType} />
                    ))}
                  </div>
                </div>
              )}

              {isTraining && metrics.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: '#6366f1' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-xs" style={{ color: '#555' }}>Initializing training…</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Model Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'model' && (
        <ModelTab savedModels={savedModels ?? []} isLoading={modelsLoading} />
      )}
    </div>
  )
}
