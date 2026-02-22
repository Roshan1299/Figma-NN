import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { AnyLayer, GraphEdge, LayerKind } from '@/types/graph'
import { formatShape } from '@/types/graph'

type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged'

interface SchemaProposalNodeData extends Record<string, unknown> {
  layer: AnyLayer
  changeType: ChangeType
}

type SchemaProposalNode = Node<SchemaProposalNodeData, 'proposal'>

const layerTitles: Record<LayerKind, string> = {
  Input: 'Input',
  Dense: 'Dense',
  Convolution: 'Conv2D',
  Pooling: 'Pooling',
  Flatten: 'Flatten',
  Dropout: 'Dropout',
  BatchNorm: 'Batch Norm',
  ResidualBlock: 'Residual Block',
  Output: 'Output',
}

const headerColors: Record<LayerKind, string> = {
  Input: '#3b82f6',
  Dense: '#06b6d4',
  Convolution: '#f97316',
  Pooling: '#a855f7',
  Flatten: '#6b7280',
  Dropout: '#eab308',
  BatchNorm: '#14b8a6',
  ResidualBlock: '#8b5cf6',
  Output: '#10b981',
}

const changeBorderColors: Record<ChangeType, string> = {
  added: '#10b981',
  removed: '#ef4444',
  modified: '#f59e0b',
  unchanged: '#3f3f46',
}

const changeBadgeStyles: Record<ChangeType, string> = {
  added: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  removed: 'bg-red-500/20 text-red-400 border-red-500/30',
  modified: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  unchanged: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30',
}

function describeLayer(layer: AnyLayer): Array<{ label: string; value: string }> {
  switch (layer.kind) {
    case 'Input':
      return [
        { label: 'Size', value: `${layer.params.size}` },
        layer.params.channels && layer.params.height && layer.params.width
          ? { label: 'Shape', value: `${layer.params.channels}x${layer.params.height}x${layer.params.width}` }
          : { label: 'Shape', value: 'Vector' },
      ]
    case 'Dense':
      return [
        { label: 'Units', value: `${layer.params.units}` },
        { label: 'Activation', value: layer.params.activation },
      ]
    case 'Convolution':
      return [
        { label: 'Filters', value: `${layer.params.filters}` },
        { label: 'Kernel', value: `${layer.params.kernel}x${layer.params.kernel}` },
        { label: 'Padding', value: layer.params.padding },
        { label: 'Activation', value: layer.params.activation },
      ]
    case 'Pooling':
      return [
        { label: 'Type', value: layer.params.type },
        { label: 'Pool', value: `${layer.params.pool_size}` },
        { label: 'Stride', value: `${layer.params.stride}` },
      ]
    case 'Flatten':
      return [{ label: 'Operation', value: 'Flatten tensor' }]
    case 'Dropout':
      return [{ label: 'Rate', value: `${layer.params.rate}` }]
    case 'Output':
      return [
        { label: 'Classes', value: `${layer.params.classes}` },
        { label: 'Activation', value: layer.params.activation },
      ]
    default:
      return []
  }
}

function SchemaProposalNodeView({ data }: NodeProps<SchemaProposalNode>) {
  const layer = data?.layer
  if (!layer) return null

  const changeType = data.changeType ?? 'unchanged'
  const headerColor = headerColors[layer.kind]

  return (
    <>
      <Handle type="target" position={Position.Left} style={{ background: '#3ecfcf', border: 'none', width: 8, height: 8 }} />
      <div className="relative overflow-hidden min-w-[160px]" style={{ background: '#1e1e1e', borderRadius: 10 }}>
        {/* Colored top strip */}
        <div
          className="px-3 py-1.5 flex items-center justify-between"
          style={{ background: headerColor + '22', borderBottom: `1px solid ${headerColor}44` }}
        >
          <span className="text-[11px] font-semibold" style={{ color: headerColor }}>
            {layerTitles[layer.kind]}
          </span>
          <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full border ${changeBadgeStyles[changeType]}`}>
            {changeType.charAt(0).toUpperCase() + changeType.slice(1)}
          </span>
        </div>

        {/* Params */}
        <div className="p-2.5 space-y-1">
          {describeLayer(layer).map((item) => (
            <div key={item.label} className="flex justify-between gap-3 text-[11px]">
              <span style={{ color: '#888' }}>{item.label}</span>
              <span className="font-medium text-white">{item.value}</span>
            </div>
          ))}
          {layer.shapeOut && (
            <div className="flex justify-between gap-3 text-[11px] pt-0.5" style={{ borderTop: '1px solid #2a2a2a' }}>
              <span style={{ color: '#888' }}>Out</span>
              <span className="font-medium" style={{ color: '#3ecfcf' }}>{formatShape(layer.shapeOut)}</span>
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#3ecfcf', border: 'none', width: 8, height: 8 }} />
    </>
  )
}

const nodeTypes: NodeTypes = {
  proposal: SchemaProposalNodeView,
}

const layerKindToNodeType: Record<LayerKind, keyof typeof nodeTypes> = {
  Input: 'proposal',
  Dense: 'proposal',
  Convolution: 'proposal',
  Pooling: 'proposal',
  Flatten: 'proposal',
  Dropout: 'proposal',
  BatchNorm: 'proposal',
  ResidualBlock: 'proposal',
  Output: 'proposal',
}

interface SchemaProposalPreviewProps {
  currentLayers: Record<string, AnyLayer>
  currentEdges: GraphEdge[]
  proposedLayers: Record<string, AnyLayer>
  proposedEdges: GraphEdge[]
  onApply: () => void
  onReject: () => void
}

export function SchemaProposalPreview({
  currentLayers,
  currentEdges,
  proposedLayers,
  proposedEdges,
  onApply,
  onReject,
}: SchemaProposalPreviewProps) {
  const { currentNodes, proposedNodes } = useMemo(() => {
    const layerChanges = new Map<string, ChangeType>()

    Object.keys(currentLayers).forEach((id) => {
      if (!proposedLayers[id]) {
        layerChanges.set(id, 'removed')
      } else {
        const current = currentLayers[id]
        const proposed = proposedLayers[id]
        const isModified =
          current.kind !== proposed.kind ||
          JSON.stringify(current.params) !== JSON.stringify(proposed.params)
        layerChanges.set(id, isModified ? 'modified' : 'unchanged')
      }
    })

    Object.keys(proposedLayers).forEach((id) => {
      if (!currentLayers[id]) {
        layerChanges.set(id, 'added')
      }
    })

    const createNodes = (layers: Record<string, AnyLayer>): Node[] => {
      return Object.values(layers).map((layer, index) => {
        const changeType = layerChanges.get(layer.id) || 'unchanged'
        const borderColor = changeBorderColors[changeType]

        return {
          id: layer.id,
          type: 'proposal' as keyof typeof layerKindToNodeType,
          position: layer.position ?? { x: index * 260 + 50, y: 200 },
          data: { layer, changeType },
          draggable: false,
          style: {
            background: 'transparent',
            border: `2px solid ${borderColor}`,
            borderRadius: 12,
            padding: 0,
            boxShadow: changeType !== 'unchanged' ? `0 0 12px ${borderColor}40` : 'none',
          },
        }
      })
    }

    return {
      currentNodes: createNodes(currentLayers),
      proposedNodes: createNodes(proposedLayers),
    }
  }, [currentLayers, proposedLayers])

  const { currentReactFlowEdges, proposedReactFlowEdges } = useMemo(() => {
    const sanitizeHandle = (handle?: string | null): string | undefined => {
      if (handle == null) return undefined
      const trimmed = String(handle).trim()
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined
      return trimmed
    }

    const createEdges = (edges: GraphEdge[]): Edge[] =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: sanitizeHandle(edge.sourceHandle),
        targetHandle: sanitizeHandle(edge.targetHandle),
        animated: true,
        style: { stroke: '#3ecfcf', strokeWidth: 1.5, opacity: 0.6 },
      }))

    return {
      currentReactFlowEdges: createEdges(currentEdges),
      proposedReactFlowEdges: createEdges(proposedEdges),
    }
  }, [currentEdges, proposedEdges])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full h-full max-w-6xl flex flex-col overflow-hidden"
        style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16, maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <div>
            <h2 className="text-base font-semibold text-white">Architecture Proposal</h2>
            <p className="text-xs mt-0.5" style={{ color: '#888' }}>Review the proposed changes before applying them to your canvas</p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] mt-0.5">
            {[
              { label: 'Added', color: '#10b981' },
              { label: 'Modified', color: '#f59e0b' },
              { label: 'Removed', color: '#ef4444' },
              { label: 'Unchanged', color: '#3f3f46' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span style={{ color: '#888' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side by side */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Current */}
          <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid #2a2a2a' }}>
            <div className="px-4 py-2.5 shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid #2a2a2a', background: '#1a1a1a' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6b7280' }} />
              <span className="text-xs font-medium" style={{ color: '#aaa' }}>Current Architecture</span>
            </div>
            <div className="flex-1" style={{ background: '#111' }}>
              <ReactFlow
                nodes={currentNodes}
                edges={currentReactFlowEdges}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#2a2a2a" gap={20} />
                <Controls showInteractive={false} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8 }} />
              </ReactFlow>
            </div>
          </div>

          {/* Proposed */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2.5 shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid #2a2a2a', background: '#1a1a1a' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3ecfcf' }} />
              <span className="text-xs font-medium" style={{ color: '#3ecfcf' }}>Proposed Architecture</span>
            </div>
            <div className="flex-1" style={{ background: '#111' }}>
              <ReactFlow
                nodes={proposedNodes}
                edges={proposedReactFlowEdges}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#2a2a2a" gap={20} />
                <Controls showInteractive={false} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8 }} />
              </ReactFlow>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid #2a2a2a', background: '#1a1a1a' }}>
          <button
            onClick={onReject}
            className="px-5 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            style={{ background: '#2a2a2a', color: '#aaa', border: '1px solid #333' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#333')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2a2a2a')}
          >
            Discard
          </button>
          <button
            onClick={onApply}
            className="px-5 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            style={{ background: '#3ecfcf', color: '#0a0a0a' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2ab8b8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3ecfcf')}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  )
}
