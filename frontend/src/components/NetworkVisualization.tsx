import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  Position,
  Handle,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { StoredLayer } from '@/hooks/useModels'

const EMNIST_SIDE = 28
const HORIZONTAL_SPACING = 320
const VERTICAL_SPACING = 72
const OUTPUT_VERTICAL_SPACING = 112
const SAMPLE_FACTOR = 8
const CONV_ROW_SPACING = 48
const CONV_COL_X_SHIFT = 28
const CONV_COL_Y_OFFSET = 12
const INPUT_SPACING = 36
const INPUT_X_SHIFT = -HORIZONTAL_SPACING * 2

type InputNeuronData = {
  activation: number
}

type NeuronNodeData = {
  layerIndex: number
  totalNeurons: number
  sampledIndex: number
  isOutput: boolean
  highlighted?: boolean
}

type ConvNeuronNodeData = {
  filters: number
  sampledFilters: number
  index: number
  columns: number
}

type OperationNodeData = {
  label: string
}

interface NetworkVisualizationProps {
  layers: StoredLayer[]
  currentDrawing?: number[][]
  activeOutput?: number | null
}

const DENSE_LAYER_TYPES = new Set(['linear', 'dense', 'output'])
const CONV_LAYER_TYPES = new Set(['conv2d'])
const OPERATION_LAYER_TYPES = new Set(['maxpool2d', 'flatten', 'dropout'])

function sanitizeLayers(layers: StoredLayer[]): StoredLayer[] {
  return layers.filter((layer) => {
    const type = layer.type.toLowerCase()
    return (
      type === 'input' ||
      DENSE_LAYER_TYPES.has(type) ||
      CONV_LAYER_TYPES.has(type) ||
      OPERATION_LAYER_TYPES.has(type)
    )
  })
}

function detectNeuronCount(layer: StoredLayer): number {
  if (typeof layer.out === 'number') return Math.max(1, layer.out)
  const sized = layer as Record<string, unknown>
  if (typeof sized.units === 'number') return Math.max(1, sized.units as number)
  if (typeof sized.size === 'number') return Math.max(1, sized.size as number)
  if (typeof sized.filters === 'number') return Math.max(1, sized.filters as number)
  if (typeof sized.out_channels === 'number') return Math.max(1, sized.out_channels as number)
  if (typeof layer.in === 'number') return Math.max(1, layer.in)
  return 1
}

function detectFilterCount(layer: StoredLayer): number {
  const sized = layer as Record<string, unknown>
  if (typeof sized.filters === 'number') return Math.max(1, sized.filters as number)
  if (typeof sized.out_channels === 'number') return Math.max(1, sized.out_channels as number)
  if (typeof sized.channels === 'number') return Math.max(1, sized.channels as number)
  if (typeof sized.depth === 'number') return Math.max(1, sized.depth as number)
  if (typeof layer.out === 'number') return Math.max(1, layer.out)
  return 1
}

function clampedMatrix(drawing?: number[][]): number[][] | null {
  if (!drawing || drawing.length !== EMNIST_SIDE || drawing[0]?.length !== EMNIST_SIDE) return null
  return drawing
}

function createInputNodes(drawing: number[][] | null): {
  nodes: Node<InputNeuronData>[]
  nodeIds: string[]
} {
  const nodes: Node<InputNeuronData>[] = []
  const nodeIds: string[] = []

  const gridWidth = (EMNIST_SIDE - 1) * INPUT_SPACING
  const halfWidth = gridWidth / 2

  for (let row = 0; row < EMNIST_SIDE; row++) {
    for (let col = 0; col < EMNIST_SIDE; col++) {
      const id = `input-${row}-${col}`
      const activation = drawing?.[row]?.[col] ?? 0
      nodeIds.push(id)
      nodes.push({
        id,
        type: 'inputNeuron',
        position: {
          x: col * INPUT_SPACING - halfWidth + INPUT_X_SHIFT,
          y: row * INPUT_SPACING - halfWidth,
        },
        data: {
          activation: Math.min(1, Math.max(0, activation / 255)),
        },
        draggable: false,
        selectable: false,
        sourcePosition: Position.Right,
      })
    }
  }

  return { nodes, nodeIds }
}

function buildNodesAndEdges(
  layers: StoredLayer[],
  drawing: number[][] | null,
  activeOutput?: number | null
): { nodes: Node<InputNeuronData | NeuronNodeData | ConvNeuronNodeData | OperationNodeData>[]; edges: Edge[] } {
  const filtered = sanitizeLayers(layers)
  const nodes: Node<InputNeuronData | NeuronNodeData | ConvNeuronNodeData | OperationNodeData>[] = []
  const edges: Edge[] = []
  const edgeIds = new Set<string>()
  const convColumns = new Map<string, { column: number; totalColumns: number }>()

  const { nodes: inputNodes, nodeIds: inputIds } = createInputNodes(drawing)
  nodes.push(...inputNodes)

  const EDGE_STEP_FIRST_LAYER = 1
  const rightmostColumnIds = inputIds.filter((id) => id.endsWith(`-${EMNIST_SIDE - 1}`))
  const initialEdgeSources = rightmostColumnIds.length > 0 ? rightmostColumnIds : inputIds

  let previousNodeIds: string[] = initialEdgeSources
  let renderIndex = 1

  filtered.forEach((layer, idx) => {
    const layerType = layer.type.toLowerCase()
    if (layerType === 'input') {
      return
    }

    const isLast = idx === filtered.length - 1
    const currentIds: string[] = []

    if (CONV_LAYER_TYPES.has(layerType)) {
      const filters = detectFilterCount(layer)
      const baseSample = Math.max(1, Math.ceil(filters / SAMPLE_FACTOR))
      const sampleCount = Math.max(1, baseSample * baseSample)
      const columns = Math.max(1, Math.ceil(Math.sqrt(sampleCount)))
      const rows = Math.max(1, Math.ceil(sampleCount / columns))
      const yOffset = ((rows - 1) * CONV_ROW_SPACING) / 2
      const baseX = renderIndex * HORIZONTAL_SPACING

      for (let i = 0; i < sampleCount; i++) {
        const row = Math.floor(i / columns)
        const col = i % columns
        const nodeId = `layer-${renderIndex}-conv-${i}`
        currentIds.push(nodeId)

        nodes.push({
          id: nodeId,
          type: 'convNeuron',
          position: {
            x: baseX + col * CONV_COL_X_SHIFT,
            y: row * CONV_ROW_SPACING - yOffset + col * CONV_COL_Y_OFFSET,
          },
          data: {
            filters,
            sampledFilters: sampleCount,
            index: i,
            columns,
          },
          draggable: false,
          selectable: false,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        })
        convColumns.set(nodeId, { column: col, totalColumns: columns })
      }
    } else if (DENSE_LAYER_TYPES.has(layerType)) {
      const neuronCount = detectNeuronCount(layer)
      const displayCount = isLast
        ? neuronCount
        : Math.max(1, Math.ceil(neuronCount / SAMPLE_FACTOR))
      const spacing = isLast ? OUTPUT_VERTICAL_SPACING : VERTICAL_SPACING
      const yOffset = ((displayCount - 1) * spacing) / 2

      for (let i = 0; i < displayCount; i++) {
        const nodeId = `layer-${renderIndex}-${i}`
        currentIds.push(nodeId)

        const nodeType = isLast ? 'outputNeuron' : 'neuron'

        nodes.push({
          id: nodeId,
          type: nodeType,
          position: {
            x: renderIndex * HORIZONTAL_SPACING,
            y: i * spacing - yOffset,
          },
          data: {
            layerIndex: renderIndex,
            totalNeurons: neuronCount,
            sampledIndex: isLast ? i : Math.min(i * SAMPLE_FACTOR, neuronCount - 1),
            isOutput: isLast,
            highlighted: isLast && typeof activeOutput === 'number' && activeOutput === i,
          },
          draggable: false,
          selectable: false,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        })
      }
    } else if (OPERATION_LAYER_TYPES.has(layerType)) {
      const nodeId = `layer-${renderIndex}-operation`
      currentIds.push(nodeId)

      const label = layerType === 'maxpool2d'
        ? 'Max Pool'
        : layerType.charAt(0).toUpperCase() + layerType.slice(1)

      nodes.push({
        id: nodeId,
        type: 'operation',
        position: {
          x: renderIndex * HORIZONTAL_SPACING,
          y: 0,
        },
        data: {
          label,
        },
        draggable: false,
        selectable: false,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })
    } else {
      renderIndex += 1
      return
    }

    const selectConvBoundary = (ids: string[]): string[] => {
      const convCandidates = ids.filter((id) => convColumns.has(id))
      if (convCandidates.length === 0) return []
      const boundary = convCandidates.filter((id) => {
        const info = convColumns.get(id)!
        return info.column === 0 || info.column === info.totalColumns - 1
      })
      return Array.from(new Set(boundary))
    }

    const selectWithStep = (ids: string[], step: number): string[] => {
      if (ids.length <= 1) return ids
      const chosen: string[] = []
      for (let i = 0; i < ids.length; i += step) {
        chosen.push(ids[i])
      }
      const last = ids[ids.length - 1]
      if (last) {
        chosen.push(last)
      }
      return Array.from(new Set(chosen))
    }

    const isFirstHiddenLayer = renderIndex === 1
    const previousIsConv = previousNodeIds.some((id) => convColumns.has(id))
    const currentIsConv = currentIds.some((id) => convColumns.has(id))

    const previousStep = isFirstHiddenLayer
      ? EDGE_STEP_FIRST_LAYER
      : Math.max(1, Math.ceil(previousNodeIds.length / 64))
    const currentStep = isFirstHiddenLayer
      ? 1
      : Math.max(1, Math.ceil(currentIds.length / 32))

    const sourceSelection = previousIsConv
      ? selectConvBoundary(previousNodeIds)
      : selectWithStep(previousNodeIds, previousStep)
    const targetSelection = currentIsConv
      ? selectConvBoundary(currentIds)
      : selectWithStep(currentIds, currentStep)

    sourceSelection.forEach((sourceId) => {
      targetSelection.forEach((targetId) => {
        if (!sourceId || !targetId) return
        const edgeId = `edge-${sourceId}-${targetId}`
        if (edgeIds.has(edgeId)) return
        edgeIds.add(edgeId)
        edges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: 'straight',
          animated: false,
          style: { stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 },
        })
      })
    })

    previousNodeIds = currentIds
    renderIndex += 1
  })

  return { nodes, edges }
}

function NeuronNode(props: NodeProps) {
  const data = props.data as NeuronNodeData
  const highlighted = !!data.highlighted

  const baseClasses =
    'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors text-sm'
  const visualClasses = highlighted
    ? 'border-primary bg-primary/20 ring-2 ring-primary/30'
    : 'border-white/20 bg-white/5'

  return (
    <div className={`${baseClasses} ${visualClasses}`}>
      <Handle
        type="source"
        position={Position.Right}
        className={`h-2! w-2! border-0! ${highlighted ? 'bg-primary!' : 'bg-white/30!'}`}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={`h-2! w-2! border-0! ${highlighted ? 'bg-primary!' : 'bg-white/30!'}`}
      />
    </div>
  )
}

function OutputNeuronNode(props: NodeProps) {
  const data = props.data as NeuronNodeData
  const highlighted = !!data.highlighted
  const baseClasses =
    'relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-colors text-xl font-bold'
  const visualClasses = highlighted
    ? 'border-primary bg-primary/20 text-primary ring-2 ring-primary/30 shadow-[0_0_16px_rgba(139,92,246,0.4)]'
    : 'border-white/15 bg-white/5 text-white/50'

  return (
    <div className={`${baseClasses} ${visualClasses}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-2.5 !w-2.5 !border-0 ${highlighted ? '!bg-primary' : '!bg-white/20'}`}
      />
      <span>
        {data.sampledIndex <= 9 ?
          String.fromCharCode(48 + Math.min(9, Math.max(0, data.sampledIndex))) :
          String.fromCharCode(65 + Math.min(25, Math.max(0, data.sampledIndex - 10)))}
      </span>
    </div>
  )
}

function OperationNode(props: NodeProps) {
  const data = props.data as OperationNodeData

  return (
    <div className="flex h-14 w-28 flex-col items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white/60 backdrop-blur">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-white/30"
      />
      <span className="uppercase text-xs font-bold tracking-wider">{data.label}</span>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-white/30"
      />
    </div>
  )
}

function InputNeuronNode(props: NodeProps) {
  const intensity = Math.round((props.data as InputNeuronData).activation * 255)
  const color = `rgb(${intensity}, ${intensity}, ${intensity})`

  return (
    <div
      className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/10"
      style={{ backgroundColor: color }}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-white/30"
      />
    </div>
  )
}

function ConvNeuronNode(_props: NodeProps) {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-500/10">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-cyan-500/60"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-cyan-500/60"
      />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  neuron: NeuronNode,
  inputNeuron: InputNeuronNode,
  convNeuron: ConvNeuronNode,
  outputNeuron: OutputNeuronNode,
  operation: OperationNode,
}

export function NetworkVisualization({ layers, currentDrawing, activeOutput }: NetworkVisualizationProps) {
  const drawingMatrix = useMemo(() => clampedMatrix(currentDrawing), [currentDrawing])

  const { nodes, edges } = useMemo(
    () => buildNodesAndEdges(layers, drawingMatrix, activeOutput),
    [layers, drawingMatrix, activeOutput]
  )

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={1.4}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background gap={24} size={1} color="rgba(255,255,255,0.06)" />
        <Controls showInteractive={false} className="shadow-lg" />
        <Panel
          position="top-center"
          className="pointer-events-none px-4 pt-3"
          style={{ width: '100%', left: '50%', transform: 'translate(-50%, 0)' }}
        >
          <div className="pointer-events-auto inline-flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 px-5 py-2 text-[11px] text-white/50 backdrop-blur-xl shadow-lg mx-auto">
            <span className="italic text-white/30">Each node ≈ 8 neurons</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/60" />
              Input
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full border border-white/20 bg-white/5" />
              Dense
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full border border-cyan-500/50 bg-cyan-500/10" />
              Conv
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-4 rounded bg-white/5 border border-white/15" />
              Op
            </span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
