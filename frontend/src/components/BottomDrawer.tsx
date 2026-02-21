import { useState } from 'react'
import type { Hyperparams } from './HyperparamsPanel'
import { DEFAULT_HYPERPARAMS } from './HyperparamsPanel'
import type { PresetType } from './PresetChips'

type TabId = 'config' | 'canvas' | 'logs'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'config',
    label: 'Config',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
  {
    id: 'canvas',
    label: 'Drawing Canvas',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>,
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  },
]

// ── Dark field primitives ─────────────────────────────────────────────────────

function CfgInput({ value, onChange, type = 'number', min, max, step }: {
  value: number | string; onChange: (v: any) => void
  type?: 'number' | 'text'; min?: number; max?: number; step?: number
}) {
  return (
    <input
      type={type}
      value={value}
      min={min} max={max} step={step}
      onChange={e => {
        if (type === 'number') {
          const v = step && step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value)
          if (!isNaN(v)) onChange(v)
        } else onChange(e.target.value)
      }}
      className="w-20 rounded-lg px-2 py-1.5 text-[12px] font-mono text-white outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all text-right"
      style={{ background: '#1c1c1e', border: '1px solid #2a2a2e' }}
    />
  )
}

function CfgSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-20 rounded-lg px-2 py-1.5 text-[12px] text-white outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-cyan-500/40 transition-all text-right"
      style={{ background: '#1c1c1e', border: '1px solid #2a2a2e' }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: '#888' }}>{label}</span>
      {children}
    </div>
  )
}

// ── Config tab ────────────────────────────────────────────────────────────────

function ConfigTab({ onParamsChange, onPresetSelect }: {
  onParamsChange?: (p: Hyperparams) => void
  onPresetSelect?: (p: PresetType) => void
}) {
  const [params, setParams] = useState<Hyperparams>(DEFAULT_HYPERPARAMS)

  const set = <K extends keyof Hyperparams>(key: K, val: Hyperparams[K]) => {
    const next = { ...params, [key]: val }
    setParams(next)
    onParamsChange?.(next)
  }
  const setOpt = <K extends keyof Hyperparams['optimizer']>(key: K, val: Hyperparams['optimizer'][K]) => {
    const next = { ...params, optimizer: { ...params.optimizer, [key]: val } }
    setParams(next)
    onParamsChange?.(next)
  }

  const PRESETS: { id: PresetType; label: string }[] = [
    { id: 'blank', label: 'Blank' },
    { id: 'simple', label: 'MLP' },
    { id: 'complex', label: 'CNN' },
  ]

  return (
    <div className="flex h-full gap-6 overflow-hidden px-4 py-3">
      {/* Presets */}
      <div className="flex flex-col gap-2 shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#444' }}>Presets</span>
        <div className="flex gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => onPresetSelect?.(p.id)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-90"
              style={{ background: '#1c1c1e', border: '1px solid #2a2a2e', color: '#aaa' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px shrink-0" style={{ background: '#1e1e1e' }} />

      {/* Hyperparams grid */}
      <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2 content-start overflow-y-auto">
        <Row label="Epochs">
          <CfgInput value={params.epochs} onChange={v => set('epochs', v)} min={1} />
        </Row>
        <Row label="Batch Size">
          <CfgInput value={params.batch_size} onChange={v => set('batch_size', v)} min={1} />
        </Row>
        <Row label="Optimizer">
          <CfgSelect
            value={params.optimizer.type}
            onChange={v => setOpt('type', v)}
            options={[{ value: 'sgd', label: 'SGD' }, { value: 'adam', label: 'Adam' }, { value: 'rmsprop', label: 'RMSProp' }]}
          />
        </Row>
        <Row label="Learning Rate">
          <CfgInput value={params.optimizer.lr} onChange={v => setOpt('lr', v)} step={0.001} min={0} />
        </Row>
        <Row label="Momentum">
          <CfgInput value={params.optimizer.momentum} onChange={v => setOpt('momentum', v)} step={0.1} min={0} max={1} />
        </Row>
        <Row label="Train Split">
          <CfgInput value={params.train_split} onChange={v => set('train_split', v)} step={0.05} min={0.5} max={0.99} />
        </Row>
        <Row label="Seed">
          <CfgInput value={params.seed} onChange={v => set('seed', v)} min={0} />
        </Row>
        <Row label="Shuffle">
          <button
            onClick={() => set('shuffle', !params.shuffle)}
            className="w-20 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-all text-right"
            style={{
              background: params.shuffle ? '#0c2d3e' : '#1c1c1e',
              border: `1px solid ${params.shuffle ? '#0891b244' : '#2a2a2e'}`,
              color: params.shuffle ? '#22d3ee' : '#555',
            }}
          >
            {params.shuffle ? 'On' : 'Off'}
          </button>
        </Row>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BottomDrawer({
  collapsed,
  onToggle,
  onParamsChange,
  onPresetSelect,
}: {
  collapsed: boolean
  onToggle: () => void
  onParamsChange?: (p: Hyperparams) => void
  onPresetSelect?: (p: PresetType) => void
}) {
  const [activeTab, setActiveTab] = useState<TabId>('config')

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex flex-col z-20 transition-all duration-200"
      style={{
        height: collapsed ? 40 : 220,
        background: '#0d0d10',
        borderTop: '1px solid #1e1e2e',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center h-10 px-2 gap-1 shrink-0" style={{ borderBottom: collapsed ? 'none' : '1px solid #1e1e2e' }}>
        {!collapsed && TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={
              activeTab === tab.id
                ? { background: '#0c1f2e', color: '#22d3ee' }
                : { color: '#555' }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        {collapsed && (
          <span className="text-[11px] px-2" style={{ color: '#444' }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </span>
        )}

        <div className="ml-auto pr-1">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#444' }}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'config' && (
            <ConfigTab onParamsChange={onParamsChange} onPresetSelect={onPresetSelect} />
          )}
          {activeTab === 'canvas' && (
            <div className="flex h-full gap-6 p-4 overflow-hidden">
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: '#0891b2', color: '#fff' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>
                    Brush
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: '#1c1c1e', border: '1px solid #2a2a2e', color: '#aaa' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4L20 11L11 20"/><path d="M10 10L14 14"/></svg>
                    Eraser
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium ml-2" style={{ background: '#1c1c1e', border: '1px solid #2a2a2e', color: '#aaa' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Clear
                  </button>
                </div>
                <div className="flex-1 w-[180px] rounded-lg flex items-center justify-center" style={{ border: '1px solid #1e1e2e', background: '#0a0a0a' }}>
                  <span className="text-[11px]" style={{ color: '#333' }}>Canvas area</span>
                </div>
              </div>
              <div className="w-px" style={{ background: '#1e1e2e' }} />
              <div className="flex gap-6 px-2 h-full items-center">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium mb-2" style={{ color: '#555' }}>Quick Test</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['A','B','C','D','E','F','G','H','I'].map(c => (
                      <button key={c} className="w-7 h-7 rounded text-[11px] font-mono flex items-center justify-center transition-colors hover:text-cyan-400" style={{ border: '1px solid #1e1e2e', background: '#111', color: '#555' }}>{c}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl p-5 min-w-[120px]" style={{ border: '1px solid #2a1f4a', background: '#100d1a' }}>
                  <span className="text-[10px] mb-1" style={{ color: '#555' }}>Prediction</span>
                  <span className="text-4xl font-bold font-mono mb-1" style={{ color: '#22d3ee' }}>A</span>
                  <span className="text-[10px]" style={{ color: '#555' }}>Conf: <span style={{ color: '#34d399' }}>92%</span></span>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'logs' && (
            <div className="flex items-center justify-center h-full">
              <span className="text-[12px]" style={{ color: '#333' }}>No logs yet.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
