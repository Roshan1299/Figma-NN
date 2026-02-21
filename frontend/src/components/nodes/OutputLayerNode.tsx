import { type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../store/graphStore';
import type { OutputLayer } from '../../types/graph';
import { PortHandle } from '../PortHandle';

export function OutputLayerNode({ id, selected, data }: NodeProps) {
  const layer = useGraphStore(state => state.layers[id]) as OutputLayer | undefined;
  const removeLayer = useGraphStore(state => state.removeLayer);

  if (!layer) return null;

  const isDragging = data?.isDragging ?? false

  return (
    <div className={`relative bg-card border rounded-xl min-w-[180px] flex items-center p-3 gap-3 transition-all duration-200 group ${isDragging ? 'shadow-[0_8px_24px_rgba(0,0,0,0.4)]' : selected ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-border shadow-sm hover:shadow-md hover:border-cyan-500/50'}`}>
      <div className="w-8 h-8 rounded bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
      </div>

      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-foreground leading-tight">Softmax</span>
        <span className="text-[11px] text-muted-foreground mt-0.5 leading-none">{layer.params.classes} classes</span>
      </div>

      <button
        type="button"
        onClick={() => removeLayer(id)}
        className="absolute -right-2 -top-2 w-5 h-5 flex items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
      >
        ×
      </button>

      {/* External port - input only */}
      <PortHandle side="left" kind="input" id="input" />
    </div>
  );
}
