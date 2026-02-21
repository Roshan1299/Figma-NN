import { type NodeProps } from '@xyflow/react'
import { useGraphStore } from '@/store/graphStore'
import { PortHandle } from '../PortHandle'

export function BatchNormLayerNode({ id, selected, data }: NodeProps) {
  const layer = useGraphStore(state => state.layers[id])
  const removeLayer = useGraphStore(state => state.removeLayer)

  if (!layer) return null

  const isDragging = data?.isDragging ?? false

  return (
    <div className={`relative bg-card border rounded-xl min-w-[180px] flex items-center p-3 gap-3 transition-all duration-200 group ${isDragging ? 'shadow-[0_8px_24px_rgba(0,0,0,0.4)]' : selected ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-border shadow-sm hover:shadow-md hover:border-cyan-500/50'}`}>
      <div className="w-8 h-8 rounded bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500"><path d="M2 12h4l3-9 6 18 3-9h4" /></svg>
      </div>

      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-foreground leading-tight">BatchNorm</span>
        <span className="text-[11px] text-muted-foreground mt-0.5 leading-none">Normalize</span>
      </div>

      <button
        type="button"
        onClick={() => removeLayer(id)}
        className="absolute -right-3 -top-3 w-7 h-7 flex items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground text-[13px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive cursor-pointer"
      >
        ×
      </button>

      <PortHandle side="left" kind="input" id="input" />
      <PortHandle side="right" kind="output" id="output" />
    </div>
  )
}
