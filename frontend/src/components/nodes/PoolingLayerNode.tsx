import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useGraphStore } from '@/store/graphStore'
import type { PoolingLayer } from '@/types/graph'

export function PoolingLayerNode({ id, selected }: NodeProps) {
  const layer = useGraphStore(state => state.layers[id]) as PoolingLayer | undefined
  const removeLayer = useGraphStore(state => state.removeLayer)

  if (!layer) return null

  return (
    <div className={`relative bg-card border ${selected ? 'border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-border shadow-sm'} rounded-xl min-w-[180px] flex items-center p-3 gap-3 transition-all hover:border-primary/50 group`}>
      <div className="w-8 h-8 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
      </div>

      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-foreground leading-tight">
          {layer.params.type === 'max' ? 'MaxPool2D' : 'AvgPool2D'}
        </span>
        <span className="text-[11px] text-muted-foreground mt-0.5 leading-none">
          {layer.params.pool_size}x{layer.params.pool_size}
        </span>
      </div>

      <button
        type="button"
        onClick={() => removeLayer(id)}
        className="absolute -right-2 -top-2 w-5 h-5 flex items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
      >
        ×
      </button>

      <Handle type="target" position={Position.Top} id="input" className="w-2.5 h-2.5 bg-primary border-background border-2 top-[-5px]" />
      <Handle type="source" position={Position.Bottom} id="output" className="w-2.5 h-2.5 bg-primary border-background border-2 bottom-[-5px]" />
    </div>
  )
}
