import { Position, type NodeProps } from '@xyflow/react'
import { useGraphStore } from '@/store/graphStore'
import type { FlattenLayer } from '@/types/graph'
import { CustomHandle } from '../CustomHandle'

export function FlattenLayerNode({ id, selected }: NodeProps) {
  const layer = useGraphStore(state => state.layers[id]) as FlattenLayer | undefined
  const removeLayer = useGraphStore(state => state.removeLayer)

  if (!layer) return null

  return (
    <div className={`relative bg-card border rounded-xl min-w-[180px] flex items-center p-3 gap-3 transition-all duration-200 group ${selected ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-border shadow-sm hover:shadow-md hover:border-cyan-500/50'}`}>
      <div className="w-8 h-8 rounded bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M4 14l6-6 6 6M4 20h16"></path></svg>
      </div>

      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-foreground leading-tight">Flatten</span>
        <span className="text-[11px] text-muted-foreground mt-0.5 leading-none">→ 1D Vector</span>
      </div>

      <button
        type="button"
        onClick={() => removeLayer(id)}
        className="absolute -right-2 -top-2 w-5 h-5 flex items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
      >
        ×
      </button>

      <CustomHandle type="target" position={Position.Top} id="input" label="Input" />
      <CustomHandle type="source" position={Position.Bottom} id="output" label="Output" />
    </div>
  )
}
