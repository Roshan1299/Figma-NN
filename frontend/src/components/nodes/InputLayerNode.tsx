import { Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../store/graphStore';
import type { InputLayer } from '../../types/graph';
import { CustomHandle } from '../CustomHandle';

export function InputLayerNode({ id, selected }: NodeProps) {
  const layer = useGraphStore(state => state.layers[id]) as InputLayer | undefined;
  const removeLayer = useGraphStore(state => state.removeLayer);

  if (!layer) return null;

  return (
    <div className={`relative bg-card border ${selected ? 'border-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-border shadow-sm'} rounded-xl min-w-[180px] flex items-center p-3 gap-3 transition-all hover:border-primary/50 group`}>
      <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
      </div>

      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-foreground leading-tight">
          {layer.params.dataset === 'emnist' ? 'EMNIST Input' : 'MNIST Input'}
        </span>
        <span className="text-[11px] text-muted-foreground mt-0.5 leading-none">
          {layer.params.dataset === 'emnist' ? '28×28 · letters A-Z' : '28×28 · digits 0-9'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => removeLayer(id)}
        className="absolute -right-2 -top-2 w-5 h-5 flex items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
      >
        ×
      </button>

      <CustomHandle type="source" position={Position.Bottom} id="output" label="Output" />
    </div>
  );
}
