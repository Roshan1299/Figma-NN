import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type NodeChange,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGraphStore, graphToArchitecture } from '@/store/graphStore'
import { InputLayerNode } from '@/components/nodes/InputLayerNode'
import { DenseLayerNode } from '@/components/nodes/DenseLayerNode'
import { ConvLayerNode } from '@/components/nodes/ConvLayerNode'
import { OutputLayerNode } from '@/components/nodes/OutputLayerNode'
import { PoolingLayerNode } from '@/components/nodes/PoolingLayerNode'
import { FlattenLayerNode } from '@/components/nodes/FlattenLayerNode'
import { DropoutLayerNode } from '@/components/nodes/DropoutLayerNode'
import { type Hyperparams, DEFAULT_HYPERPARAMS } from '@/components/HyperparamsPanel'
import { validateConnection, notifyConnectionError } from '@/lib/shapeInference'
import { useTrainingMetrics } from '@/hooks/useTraining'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightInspector } from '@/components/RightInspector'
import { BottomDrawer } from '@/components/BottomDrawer'
import type { ActivationType, LayerKind, AnyLayer } from '@/types/graph'
import { ChatbotPanel } from '@/components/ChatbotPanel'
import { SchemaProposalPreview } from '@/components/SchemaProposalPreview'
import { useChat } from '@/hooks/useChat'
import { getPresetGraph, type PresetType } from '@/components/PresetChips'
import { useCollaboration } from '@/hooks/useCollaboration'
import { CollabCursors } from '@/components/CollabCursors'
import { ConnectionPreview } from '@/components/ConnectionPreview'
import { GridBackground } from '@/components/GridBackground'
import { AlignmentGuides } from '@/components/AlignmentGuides'

const nodeTypes: NodeTypes = {
  input: InputLayerNode,
  dense: DenseLayerNode,
  conv: ConvLayerNode,
  pool: PoolingLayerNode,
  flatten: FlattenLayerNode,
  dropout: DropoutLayerNode,
  output: OutputLayerNode,
};

const layerKindToNodeType: Record<LayerKind, keyof typeof nodeTypes> = {
  Input: 'input',
  Dense: 'dense',
  Convolution: 'conv',
  Pooling: 'pool',
  Flatten: 'flatten',
  Dropout: 'dropout',
  Output: 'output',
}

const layerIdPrefixes: Record<LayerKind, string> = {
  Input: 'input',
  Dense: 'dense',
  Convolution: 'conv',
  Pooling: 'pool',
  Flatten: 'flatten',
  Dropout: 'dropout',
  Output: 'output',
}

const duplicableLayerKinds = new Set<LayerKind>(['Dense', 'Convolution', 'Pooling', 'Dropout', 'Flatten'])

// ── Train Bar component ───────────────────────────────────────────────────────
import type { MetricData } from '@/api/types'
import type { Hyperparams as HyperparamsType } from '@/components/HyperparamsPanel'

function TrainBar({
  isTraining, canCancel, isCancelling, currentState, metrics, hyperparams,
  onTrain, onCancel, drawerCollapsed, isDirty,
}: {
  isTraining: boolean
  canCancel: boolean
  isCancelling: boolean
  currentState: string | null
  metrics: MetricData[]
  hyperparams: HyperparamsType
  onTrain: () => void
  onCancel: () => void
  drawerCollapsed: boolean
  isDirty: boolean
}) {
  const latestMetric = metrics.at(-1)
  const totalEpochs = hyperparams.epochs ?? 10
  const overallProgress = latestMetric
    ? Math.min(1, ((latestMetric.epoch - 1 + (latestMetric.progress ?? 1)) / totalEpochs))
    : 0
  const pct = isTraining ? Math.round(overallProgress * 100)
    : currentState === 'succeeded' && !isDirty ? 100
    : 0

  // When user changes something after training, revert to ready state
  const effectiveState = isDirty ? null : currentState
  const isDone = effectiveState === 'succeeded'
  const isFailed = effectiveState === 'failed'

  const bottomOffset = drawerCollapsed ? 48 : 308

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      style={{ bottom: bottomOffset }}
    >
      <button
        onClick={canCancel ? onCancel : (!isDone && !isFailed ? onTrain : onTrain)}
        disabled={isCancelling || (isTraining && !canCancel)}
        className="relative flex items-center gap-4 rounded-2xl px-3 py-3 select-none transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(8, 15, 20, 0.75)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          minWidth: 280,
          cursor: isCancelling ? 'wait' : 'pointer',
        }}
      >
        {/* Circle icon */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all"
          style={{
            background: isDone ? '#065f46' : isFailed ? '#7f1d1d' : canCancel ? '#0e7490' : '#0891b2',
            boxShadow: `0 0 16px ${isDone ? '#34d39944' : isFailed ? '#f8717144' : '#0891b244'}`,
          }}
        >
          {isCancelling ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : canCancel ? (
            <svg className="w-5 h-5" fill="white" viewBox="0 0 20 20">
              <path d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1H5zm8 0a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1h-2z" />
            </svg>
          ) : isDone ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : isFailed ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="white" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[13px] font-semibold tracking-widest uppercase"
              style={{ color: isDone ? '#34d399' : isFailed ? '#f87171' : '#aaa' }}
            >
              {isCancelling ? 'Cancelling…'
                : canCancel ? 'Stop Training'
                : isDone ? 'Completed'
                : isFailed ? 'Failed'
                : 'Ready to Train'}
            </span>
            <span className="text-[13px] font-bold font-mono ml-4" style={{ color: isDone ? '#34d399' : '#0891b2' }}>
              {pct}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: '#1e2a2e' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${isDone ? 100 : pct}%`,
                background: isDone ? '#34d399' : isFailed ? '#f87171' : 'linear-gradient(90deg, #06b6d4, #22d3ee)',
              }}
            />
          </div>
        </div>
      </button>
    </div>
  )
}

function generateLayerId(kind: LayerKind) {
  const prefix = layerIdPrefixes[kind]
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export default function Playground() {
  const { layers, edges, addLayer, addEdge, removeEdge, updateLayerPosition, removeLayer, applyProposedSchema, loadGraph } = useGraphStore()
  const [hyperparams, setHyperparams] = useState<Hyperparams>(DEFAULT_HYPERPARAMS)
  const [showProposalPreview, setShowProposalPreview] = useState(false)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [bottomCollapsed, setBottomCollapsed] = useState(false)
  // Track if anything changed since last training run (to reset the train button)
  const [isDirty, setIsDirty] = useState(false)
  const lastTrainedRef = useRef(false)
  const {
    metrics,
    currentState,
    isTraining,
    runId,
    samplePredictions,
    lastRunHyperparams,
    startTraining,
    cancelTraining: cancelActiveTraining,
    isCancelling,
  } = useTrainingMetrics()
  const canCancelTraining = Boolean(
    runId && (isTraining || currentState === 'running' || currentState === 'queued')
  )
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])
  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null)
  const [copiedLayer, setCopiedLayer] = useState<{
    kind: LayerKind
    params: Record<string, any>
    basePosition: { x: number; y: number } | null
    offset: number
  } | null>(null)
  const { messages, isStreaming, isGeneratingSchema, proposedSchema, sendMessage, clearProposedSchema, addMessage, clearMessages } = useChat()
  const { broadcastOp, broadcastCursor } = useCollaboration()
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)

  // Convert store state to ReactFlow format with auto-layout
  const reactFlowNodes = useMemo((): Node[] => {
    const layerArray = Object.values(layers);
    return layerArray.map((layer, index) => ({
      id: layer.id,
      type: layerKindToNodeType[layer.kind],
      position: layer.position ?? { x: index * 300 + 50, y: 250 },
      data: { isDragging: draggingNodeId === layer.id },
      draggable: true,
      style: {
        background: 'transparent',
        border: 'none',
        padding: 0,
        boxShadow: 'none',
      },
    }));
  }, [layers, draggingNodeId]);

  const reactFlowEdges = useMemo((): Edge[] => {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
      label: edge.label,
      animated: true,
      reconnectable: true,
      style: { strokeWidth: 2, stroke: 'rgba(6,182,212,0.6)' },
      labelStyle: { fill: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'ui-monospace,monospace', fontWeight: 500 },
      labelBgStyle: { fill: 'transparent', stroke: 'transparent' },
      labelBgPadding: [2, 2] as [number, number],
    }));
  }, [edges]);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const { source, target } = newConnection;
      if (!source || !target) return;

      const sourceLayer = layers[source];
      const targetLayer = layers[target];
      if (!sourceLayer || !targetLayer) return;

      const validation = validateConnection(sourceLayer, targetLayer);
      if (!validation.valid) {
        notifyConnectionError(validation.error || 'Invalid connection');
        return;
      }

      removeEdge(oldEdge.id);
      const handleKey = (handle?: string | null) => handle ?? 'default';
      const edgeId = `${source}:${handleKey(newConnection.sourceHandle)}->${target}:${handleKey(newConnection.targetHandle)}`;
      const edge = {
        id: edgeId,
        source,
        target,
        sourceHandle: newConnection.sourceHandle ?? null,
        targetHandle: newConnection.targetHandle ?? null,
      };
      addEdge(edge);
      broadcastOp({ op_type: 'remove_edge', payload: { id: oldEdge.id } });
      broadcastOp({ op_type: 'add_edge', payload: { edge } });
    },
    [layers, removeEdge, addEdge, broadcastOp]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target) return;

      const sourceLayer = layers[source];
      const targetLayer = layers[target];

      if (!sourceLayer || !targetLayer) return;

      const validation = validateConnection(sourceLayer, targetLayer);

      if (!validation.valid) {
        notifyConnectionError(validation.error || 'Invalid connection');
        return;
      }

      const handleKey = (handle?: string | null) => handle ?? 'default';
      const edgeId = `${source}:${handleKey(connection.sourceHandle)}->${target}:${handleKey(connection.targetHandle)}`;
      const edge = {
        id: edgeId,
        source,
        target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      };
      addEdge(edge);
      broadcastOp({ op_type: 'add_edge', payload: { edge } });
    },
    [layers, edges, addEdge, broadcastOp]
  );

  const onEdgesChange = useCallback(
    (changes: any[]) => {
      changes.forEach(change => {
        if (change.type === 'remove') {
          removeEdge(change.id);
          broadcastOp({ op_type: 'remove_edge', payload: { id: change.id } });
        }
      });
    },
    [removeEdge, broadcastOp]
  );

  const reactFlowWrapper = useRef<HTMLDivElement | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updateLayerPosition(change.id, change.position)
          if (change.dragging) {
            setDraggingNodeId(change.id)
          } else {
            setDraggingNodeId(null)
            broadcastOp({ op_type: 'update_layer_position', payload: { id: change.id, position: change.position } })
          }
        }
        if (change.type === 'remove') {
          removeLayer(change.id)
          broadcastOp({ op_type: 'remove_layer', payload: { id: change.id } })
        }
      })
    },
    [updateLayerPosition, removeLayer, broadcastOp]
  )

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (!reactFlowWrapper.current || !reactFlowInstance) return
      const raw = event.dataTransfer.getData('application/layer-template')
      if (!raw) return

      type LayerTemplatePayload =
        | { kind: 'Input'; params: { dataset: 'mnist' | 'emnist'; size?: number } }
        | { kind: 'Dense'; params: { units: number; activation: ActivationType } }
        | {
          kind: 'Convolution'
          params: {
            filters: number
            kernel: number
            stride: number
            padding: 'valid' | 'same'
            activation: Exclude<ActivationType, 'softmax'>
          }
        }
        | { kind: 'Flatten'; params: Record<string, never> }
        | { kind: 'Dropout'; params: { rate: number } }
        | {
            kind: 'Pooling'
            params: { type: 'max'; pool_size: number; stride: number; padding: number }
          }
        | { kind: 'Output'; params: { classes: number; activation: 'softmax' } }

      try {
        const payload = JSON.parse(raw) as LayerTemplatePayload

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        let newLayer: AnyLayer | null = null

        if (payload.kind === 'Input') {
          newLayer = { id: generateLayerId('Input'), kind: 'Input', params: { dataset: payload.params.dataset ?? 'mnist', size: payload.params.size ?? 784 }, position }
        } else if (payload.kind === 'Dense') {
          newLayer = { id: generateLayerId('Dense'), kind: 'Dense', params: { units: payload.params.units, activation: payload.params.activation }, position }
        } else if (payload.kind === 'Convolution') {
          newLayer = { id: generateLayerId('Convolution'), kind: 'Convolution', params: { filters: payload.params.filters, kernel: payload.params.kernel, stride: payload.params.stride, padding: payload.params.padding, activation: payload.params.activation }, position }
        } else if (payload.kind === 'Flatten') {
          newLayer = { id: generateLayerId('Flatten'), kind: 'Flatten', params: {}, position }
        } else if (payload.kind === 'Dropout') {
          newLayer = { id: generateLayerId('Dropout'), kind: 'Dropout', params: { rate: payload.params.rate }, position }
        } else if (payload.kind === 'Pooling') {
          newLayer = { id: generateLayerId('Pooling'), kind: 'Pooling', params: { type: 'max', pool_size: payload.params.pool_size, stride: payload.params.stride, padding: payload.params.padding }, position }
        } else if (payload.kind === 'Output') {
          newLayer = { id: generateLayerId('Output'), kind: 'Output', params: { classes: payload.params.classes, activation: payload.params.activation }, position }
        }

        if (newLayer) {
          addLayer(newLayer)
          broadcastOp({ op_type: 'add_layer', payload: { layer: newLayer } })
        }
      } catch (error) {
      }
    },
    [addLayer, reactFlowInstance]
  )
  const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    const nodeIds = params.nodes.map((node) => node.id)
    setSelectedNodeIds(nodeIds)
    setSelectedEdgeIds(params.edges.map((edge) => edge.id))
    // Keep last selected node pinned so props don't disappear when typing in inputs
    if (nodeIds.length === 1) setPinnedNodeId(nodeIds[0])
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable) {
          return
        }
      }

      const isCopy = (event.key === 'c' || event.key === 'C') && (event.ctrlKey || event.metaKey)
      const isPaste = (event.key === 'v' || event.key === 'V') && (event.ctrlKey || event.metaKey)
      const isDeleteKey = event.key === 'Delete' || event.key === 'Backspace'

      if (isCopy) {
        if (selectedNodeIds.length === 1) {
          const layer = layers[selectedNodeIds[0]] as AnyLayer | undefined
          if (layer && duplicableLayerKinds.has(layer.kind)) {
            setCopiedLayer({
              kind: layer.kind,
              params: JSON.parse(JSON.stringify(layer.params)),
              basePosition: layer.position ? { ...layer.position } : null,
              offset: 1,
            })
            event.preventDefault()
          }
        }
        return
      }

      if (isPaste) {
        if (copiedLayer && duplicableLayerKinds.has(copiedLayer.kind)) {
          const base = copiedLayer.basePosition ?? { x: 100, y: 100 }
          const offsetDistance = 30 * copiedLayer.offset
          const position = {
            x: base.x + offsetDistance,
            y: base.y + offsetDistance,
          }
          const newId = generateLayerId(copiedLayer.kind)

          const pastedLayer = {
            id: newId,
            kind: copiedLayer.kind,
            params: JSON.parse(JSON.stringify(copiedLayer.params)),
            position,
          } as AnyLayer

          addLayer(pastedLayer)
          broadcastOp({ op_type: 'add_layer', payload: { layer: pastedLayer } })

          setCopiedLayer((prev) =>
            prev
              ? {
                ...prev,
                offset: prev.offset + 1,
              }
              : prev
          )
          event.preventDefault()
        }
        return
      }

      if (isDeleteKey) {
        if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
          event.preventDefault()
          selectedNodeIds.forEach((id) => {
            removeLayer(id)
            broadcastOp({ op_type: 'remove_layer', payload: { id } })
          })
          selectedEdgeIds.forEach((id) => {
            removeEdge(id)
            broadcastOp({ op_type: 'remove_edge', payload: { id } })
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedNodeIds, selectedEdgeIds, layers, copiedLayer, addLayer, removeLayer, removeEdge, broadcastOp])

  const handlePresetSelect = useCallback((preset: PresetType) => {
    const presetGraph = getPresetGraph(preset)
    loadGraph(presetGraph.layers, presetGraph.edges)
    broadcastOp({ op_type: 'load_graph', payload: { layers: presetGraph.layers, edges: presetGraph.edges } })
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.05, duration: 300 })
    }
  }, [loadGraph, reactFlowInstance, broadcastOp])

  // Mark dirty when layers/edges change after a training run
  useEffect(() => {
    if (lastTrainedRef.current) {
      setIsDirty(true)
    }
  }, [layers, edges])

  useEffect(() => {
    if (Object.keys(layers).length === 0) {
      const blankPreset = getPresetGraph('blank')
      loadGraph(blankPreset.layers, blankPreset.edges)
      if (reactFlowInstance) {
        reactFlowInstance.setViewport({ x: 120, y: 0, zoom: 0.85 }, { duration: 300 })
        reactFlowInstance.fitView({ padding: 0.05, duration: 300 })
      }
    } else if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.05, duration: 300 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactFlowInstance]);

  const handleRun = useCallback(() => {
    try {
      // Convert graph to backend architecture format
      const architecture = graphToArchitecture(layers, edges) as {
        input_size: number
        layers: { type: string; in?: number | undefined; out?: number | undefined }[]
      }

      // Find the input layer to get the dataset type
      const inputLayer = Object.values(layers).find(layer => layer.kind === 'Input');
      const datasetType = inputLayer?.params.dataset || 'mnist'; // Default to mnist
      
      // Update hyperparams with dataset type
      const updatedHyperparams = {
        ...hyperparams,
        dataset_type: datasetType
      }

      setIsDirty(false)
      lastTrainedRef.current = true

      startTraining({
        architecture,
        hyperparams: updatedHyperparams,
      })
    } catch (error) {
      console.error('❌ Training error:', error)
    }
  }, [layers, edges, hyperparams, startTraining])

  const handleApplyProposal = useCallback(() => {
    if (proposedSchema) {
      console.log('Applying proposed schema:', proposedSchema)
      applyProposedSchema(proposedSchema)
      broadcastOp({ op_type: 'load_graph', payload: { layers: proposedSchema.layers as Record<string, unknown>, edges: proposedSchema.edges } })
      addMessage({ role: 'system', content: 'Architecture changes applied successfully.' })
      setShowProposalPreview(false)
      clearProposedSchema()
    }
  }, [proposedSchema, applyProposedSchema, clearProposedSchema, addMessage, broadcastOp])

  const handleRejectProposal = useCallback(() => {
    addMessage({ role: 'system', content: 'Architecture changes rejected.' })
    setShowProposalPreview(false)
    clearProposedSchema()
  }, [clearProposedSchema, addMessage])

  const onMouseMoveOnCanvas = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!reactFlowInstance || !reactFlowWrapper.current) return
      const rect = reactFlowWrapper.current.getBoundingClientRect()
      const flowPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
      broadcastCursor(flowPos.x, flowPos.y)
    },
    [reactFlowInstance, broadcastCursor]
  )

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden bg-background">
      <LeftSidebar collapsed={leftCollapsed} onToggleCollapse={() => setLeftCollapsed(v => !v)} />

      {/* Center Workspace */}
      <div className="flex-1 relative flex flex-col min-w-0">
        <div className="h-full w-full" ref={reactFlowWrapper} onMouseMove={onMouseMoveOnCanvas}>
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onEdgesChange={onEdgesChange}
            onNodesChange={onNodesChange}
            onSelectionChange={onSelectionChange}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodesDraggable={!isTraining}
            nodesConnectable={!isTraining}
            nodeTypes={nodeTypes}
            selectNodesOnDrag={false}
            multiSelectionKeyCode="shift"
            panOnDrag={true}
            panOnScroll={false}
            zoomOnScroll={true}
            zoomOnPinch={true}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{ animated: true, style: { stroke: 'oklch(0.65 0.15 195)', strokeWidth: 2, strokeDasharray: '4 4' } }}
            onInit={setReactFlowInstance}
            className="bg-background [&_.react-flow__pane]:bg-transparent"
          >
            <GridBackground />
            <Background gap={24} size={1} color="rgba(255, 255, 255, 0.15)" />
            <Controls position="bottom-left" showInteractive={false} className="shadow-lg" />
            <AlignmentGuides />
            <ConnectionPreview />
            <CollabCursors />
          </ReactFlow>
        </div>

        {/* Train Bar — floats above BottomDrawer */}
        <TrainBar
          isTraining={isTraining}
          canCancel={canCancelTraining}
          isCancelling={isCancelling}
          currentState={currentState}
          metrics={metrics}
          hyperparams={hyperparams}
          onTrain={handleRun}
          onCancel={() => { void cancelActiveTraining() }}
          drawerCollapsed={bottomCollapsed}
          isDirty={isDirty}
        />

        <BottomDrawer
          collapsed={bottomCollapsed}
          onToggle={() => setBottomCollapsed(v => !v)}
          onParamsChange={(p) => { setHyperparams(p); if (lastTrainedRef.current) setIsDirty(true) }}
          onPresetSelect={handlePresetSelect}
        />
      </div>

      <RightInspector
        selectedNodeId={pinnedNodeId}
        collapsed={rightCollapsed}
        onToggleCollapse={() => setRightCollapsed(v => !v)}
        isTraining={isTraining}
        metrics={metrics}
        currentState={currentState}
        runId={runId}
        samplePredictions={samplePredictions}
        datasetType={lastRunHyperparams?.dataset_type as 'mnist' | 'emnist' | 'audio' | 'text' | undefined}
        onCancel={() => { void cancelActiveTraining() }}
        canCancel={canCancelTraining}
        isCancelling={isCancelling}
      />

      <ChatbotPanel
        onViewProposal={() => setShowProposalPreview(true)}
        messages={messages}
        isStreaming={isStreaming}
        isGeneratingSchema={isGeneratingSchema}
        proposedSchema={proposedSchema}
        sendMessage={sendMessage}
        clearMessages={clearMessages}
      />

      {showProposalPreview && proposedSchema && (
        <SchemaProposalPreview
          currentLayers={layers}
          currentEdges={edges}
          proposedLayers={proposedSchema.layers}
          proposedEdges={proposedSchema.edges}
          onApply={handleApplyProposal}
          onReject={handleRejectProposal}
        />
      )}
    </div>
  )
}
