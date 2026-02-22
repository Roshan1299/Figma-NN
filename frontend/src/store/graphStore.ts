import { create } from 'zustand'
import type { AnyLayer, GraphEdge, TensorShape } from '../types/graph'
import { formatShape } from '../types/graph'
import type { TrainingRequest } from '@/api/types'

type Snapshot = { layers: Record<string, AnyLayer>; edges: GraphEdge[] }

interface GraphState {
  layers: Record<string, AnyLayer>
  edges: GraphEdge[]

  // Undo / Redo
  _undoStack: Snapshot[]
  _redoStack: Snapshot[]
  _skipUndo: boolean
  _pushUndo: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  // Actions
  addLayer: (layer: AnyLayer) => void
  removeLayer: (id: string) => void
  updateLayerParams: (id: string, params: Record<string, any>) => void
  updateLayerPosition: (id: string, position: { x: number; y: number }) => void
  addEdge: (edge: GraphEdge) => void
  removeEdge: (id: string) => void
  recomputeShapes: () => void
  getInputShape: (layerId: string) => TensorShape | undefined
  applyProposedSchema: (schema: { layers: Record<string, AnyLayer>, edges: GraphEdge[] }) => void
  clearGraph: () => void
  loadGraph: (layers: Record<string, AnyLayer>, edges: GraphEdge[]) => void
}

const MAX_UNDO = 50

// Compute output shape for a layer given its input shape
function computeOutputShape(layer: AnyLayer, inputShape?: TensorShape): TensorShape {
  switch (layer.kind) {
    case 'Input': {
      const { channels, height, width, size } = layer.params
      if (channels && height && width) {
        return { type: 'image', channels, height, width }
      }
      return { type: 'vector', size }
    }

    case 'Dense':
      if (inputShape?.type === 'vector') {
        return { type: 'vector', size: layer.params.units }
      }
      return { type: 'unknown' }

    case 'Convolution': {
      let imageShape = inputShape
      if (imageShape?.type === 'vector') {
        imageShape = inferImageShapeFromSize(imageShape.size)
      }
      if (!imageShape || imageShape.type !== 'image') {
        return { type: 'unknown' }
      }

      const { kernel, stride, padding, filters } = layer.params
      const nextHeight = computeConvOutputDim(imageShape.height, kernel, stride, padding)
      const nextWidth = computeConvOutputDim(imageShape.width, kernel, stride, padding)
      return { type: 'image', channels: filters, height: nextHeight, width: nextWidth }
    }

    case 'Pooling': {
      let imageShape = inputShape
      if (imageShape?.type === 'vector') {
        imageShape = inferImageShapeFromSize(imageShape.size)
      }
      if (!imageShape || imageShape.type !== 'image') {
        return { type: 'unknown' }
      }

      const { pool_size, stride, padding } = layer.params
      const nextHeight = computePoolOutputDim(imageShape.height, pool_size, stride, padding)
      const nextWidth = computePoolOutputDim(imageShape.width, pool_size, stride, padding)
      return {
        type: 'image',
        channels: imageShape.channels,
        height: nextHeight,
        width: nextWidth,
      }
    }

    case 'Flatten':
      if (!inputShape) return { type: 'unknown' }
      if (inputShape.type === 'vector') return inputShape
      if (inputShape.type === 'image') {
        const flattened = inputShape.channels * inputShape.height * inputShape.width
        return { type: 'vector', size: flattened }
      }
      return { type: 'unknown' }

    case 'Dropout':
    case 'BatchNorm':
      return inputShape ?? { type: 'unknown' }

    case 'ResidualBlock': {
      if (!inputShape || inputShape.type !== 'image') return { type: 'unknown' }
      // Same-padding convolutions preserve spatial dims; channel count changes to filters
      return { type: 'image', channels: layer.params.filters, height: inputShape.height, width: inputShape.width }
    }

    case 'Output':
      if (inputShape?.type === 'vector') {
        return { type: 'vector', size: layer.params.classes }
      }
      return { type: 'unknown' }

    default:
      return { type: 'unknown' }
  }
}

export const useGraphStore = create<GraphState>((set, get) => ({
  layers: {},
  edges: [],

  _undoStack: [],
  _redoStack: [],
  _skipUndo: false,
  canUndo: false,
  canRedo: false,

  _pushUndo: () => {
    if (get()._skipUndo) return
    const { layers, edges, _undoStack } = get()
    // Don't snapshot an empty canvas — undoing back to empty is never useful
    // and causes the "undo wipes everything" bug on initial load
    if (Object.keys(layers).length === 0 && edges.length === 0) return
    const snapshot: Snapshot = {
      layers: JSON.parse(JSON.stringify(layers)),
      edges: JSON.parse(JSON.stringify(edges)),
    }
    const stack = [..._undoStack, snapshot].slice(-MAX_UNDO)
    set({ _undoStack: stack, _redoStack: [], canUndo: true, canRedo: false })
  },

  undo: () => {
    const { _undoStack, layers, edges } = get()
    if (_undoStack.length === 0) return
    const prev = _undoStack[_undoStack.length - 1]
    const currentSnapshot: Snapshot = {
      layers: JSON.parse(JSON.stringify(layers)),
      edges: JSON.parse(JSON.stringify(edges)),
    }
    set((state) => ({
      layers: prev.layers,
      edges: prev.edges,
      _undoStack: state._undoStack.slice(0, -1),
      _redoStack: [...state._redoStack, currentSnapshot],
      canUndo: state._undoStack.length > 1,
      canRedo: true,
    }))
    get().recomputeShapes()
  },

  redo: () => {
    const { _redoStack, layers, edges } = get()
    if (_redoStack.length === 0) return
    const next = _redoStack[_redoStack.length - 1]
    const currentSnapshot: Snapshot = {
      layers: JSON.parse(JSON.stringify(layers)),
      edges: JSON.parse(JSON.stringify(edges)),
    }
    set((state) => ({
      layers: next.layers,
      edges: next.edges,
      _redoStack: state._redoStack.slice(0, -1),
      _undoStack: [...state._undoStack, currentSnapshot],
      canRedo: state._redoStack.length > 1,
      canUndo: true,
    }))
    get().recomputeShapes()
  },

  addLayer: (layer) => {
    get()._pushUndo()
    set((state) => {
      let newLayers: Record<string, AnyLayer> = { ...state.layers, [layer.id]: layer }
      // When adding an Input layer, auto-update any existing Output layer's classes
      if (layer.kind === 'Input' && layer.params.dataset) {
        const outputClasses = layer.params.dataset === 'emnist' ? 26 : 10
        const outputEntry = Object.entries(newLayers).find(([, l]) => l.kind === 'Output')
        if (outputEntry) {
          const [outId, outLayer] = outputEntry
          newLayers = {
            ...newLayers,
            [outId]: { ...outLayer, params: { ...outLayer.params, classes: outputClasses } } as AnyLayer
          }
        }
      }
      return { layers: newLayers }
    })
    get().recomputeShapes()
  },

  removeLayer: (id) => {
    get()._pushUndo()
    set((state) => {
      const { [id]: removed, ...rest } = state.layers
      return {
        layers: rest as Record<string, AnyLayer>,
        edges: state.edges.filter(e => e.source !== id && e.target !== id)
      }
    })
  },

  updateLayerParams: (id, params) => {
    get()._pushUndo()
    set((state) => {
      const layer = state.layers[id]
      if (!layer) return state

      let updatedLayers: Record<string, AnyLayer> = {
        ...state.layers,
        [id]: { ...layer, params: { ...layer.params, ...params } } as AnyLayer
      }

      // When Input layer dataset changes, auto-update Output layer classes
      if (layer.kind === 'Input' && params.dataset !== undefined) {
        const outputClasses = params.dataset === 'emnist' ? 26 : 10
        const outputEntry = Object.entries(updatedLayers).find(([, l]) => l.kind === 'Output')
        if (outputEntry) {
          const [outId, outLayer] = outputEntry
          updatedLayers = {
            ...updatedLayers,
            [outId]: { ...outLayer, params: { ...outLayer.params, classes: outputClasses } } as AnyLayer
          }
        }
      }

      return { layers: updatedLayers as Record<string, AnyLayer> }
    })
    get().recomputeShapes()
  },

  updateLayerPosition: (id, position) => {
    set((state) => {
      const layer = state.layers[id]
      if (!layer) return state
      return {
        layers: {
          ...state.layers,
          [id]: { ...layer, position } as AnyLayer,
        } as Record<string, AnyLayer>,
      }
    })
  },

  addEdge: (edge) => {
    get()._pushUndo()
    const normalizeHandle = (handle?: string | null) => handle ?? null

    set((state) => {
      const nextEdges = state.edges.filter((existing) => {
        const sameSourcePort =
          existing.source === edge.source &&
          normalizeHandle(existing.sourceHandle) === normalizeHandle(edge.sourceHandle)

        const sameTargetPort =
          existing.target === edge.target &&
          normalizeHandle(existing.targetHandle) === normalizeHandle(edge.targetHandle)

        return !sameSourcePort && !sameTargetPort
      })

      const updatedEdges = [...nextEdges, edge] as GraphEdge[]
      return {
        edges: updatedEdges
      }
    })
    get().recomputeShapes()
  },

  removeEdge: (id) => {
    get()._pushUndo()
    set((state) => ({
      edges: state.edges.filter(e => e.id !== id)
    }))
    get().recomputeShapes()
  },

  getInputShape: (layerId: string): TensorShape | undefined => {
    const state = get()
    const incomingEdge = state.edges.find(e => e.target === layerId)

    if (!incomingEdge) return undefined

    const sourceLayer = state.layers[incomingEdge.source]
    return sourceLayer?.shapeOut
  },

  recomputeShapes: () => set((state) => {
    const updatedLayers = { ...state.layers }
    const visited = new Set<string>()

    // Topological sort helper
    function visit(layerId: string) {
      if (visited.has(layerId)) return
      visited.add(layerId)

      const layer = updatedLayers[layerId]
      if (!layer) return

      // Find incoming edge
      const incomingEdge = state.edges.find(e => e.target === layerId)

      // Visit source first if exists
      if (incomingEdge) {
        visit(incomingEdge.source)
      }

      // Get input shape
      const inputShape = incomingEdge
        ? updatedLayers[incomingEdge.source]?.shapeOut
        : undefined

      // Compute output shape
      const outputShape = computeOutputShape(layer, inputShape)
      updatedLayers[layerId] = { ...layer, shapeOut: outputShape }
    }

    // Visit all layers
    Object.keys(updatedLayers).forEach(visit)

    // Update edge labels with shapes
    const updatedEdges = state.edges.map(edge => {
      const sourceLayer = updatedLayers[edge.source]
      const label = sourceLayer?.shapeOut ? formatShape(sourceLayer.shapeOut) : undefined
      return { ...edge, label }
    })

    return {
      layers: updatedLayers as Record<string, AnyLayer>,
      edges: updatedEdges
    }
  }),

  applyProposedSchema: (schema) => {
    get()._pushUndo()
    set({ _skipUndo: true })
    get().clearGraph()
    Object.values(schema.layers).forEach((layer) => {
      const newId = layer.id
      get().addLayer({
        ...layer,
        id: newId,
        params: { ...layer.params },
        position: layer.position ? { ...layer.position } : undefined,
      } as AnyLayer)
    })
    schema.edges.forEach((edge) => {
      get().addEdge({
        ...edge,
        sourceHandle: edge.sourceHandle ?? 'output',
        targetHandle: edge.targetHandle ?? 'input',
      })
    })
    set({ _skipUndo: false })
  },

  clearGraph: () => {
    get()._pushUndo()
    set({
      layers: {},
      edges: []
    })
  },

  loadGraph: (layers, edges) => {
    get()._pushUndo()
    set({ _skipUndo: true })

    const normalizedLayers = Object.values(layers).map((layer) => ({
      ...layer,
      params: { ...layer.params },
      position: layer.position ? { ...layer.position } : undefined,
    }))

    const normalizedEdges = edges.map((edge) => ({
      ...edge,
      sourceHandle: edge.sourceHandle ?? 'output',
      targetHandle: edge.targetHandle ?? 'input',
    })) as GraphEdge[]

    set({
      layers: {},
      edges: [],
    })

    normalizedLayers.forEach((layer) => {
      get().addLayer(layer as AnyLayer)
    })

    normalizedEdges.forEach((edge) => {
      get().addEdge(edge)
    })
    set({ _skipUndo: false })
  }
}))

// Convert graph to backend architecture format
type VectorShapeState = Extract<TensorShape, { type: 'vector' }>
type ImageShapeState = Extract<TensorShape, { type: 'image' }>
type ShapeState = VectorShapeState | ImageShapeState

function inferImageShapeFromSize(size: number): ImageShapeState | undefined {
  const side = Math.round(Math.sqrt(size))
  if (side * side !== size) return undefined
  return { type: 'image', channels: 1, height: side, width: side }
}

function ensureFlattenLayer(
  state: ShapeState,
  layers: TrainingRequest['architecture']['layers']
): VectorShapeState {
  if (state.type === 'vector') return state
  const flattenedSize = state.channels * state.height * state.width
  layers.push({ type: 'flatten' })
  return { type: 'vector', size: flattenedSize }
}

function computeConvOutputDim(
  input: number,
  kernel: number,
  stride: number,
  padding: 'same' | 'valid'
): number {
  if (padding === 'same') {
    return Math.ceil(input / Math.max(1, stride))
  }
  const effectiveStride = Math.max(1, stride)
  return Math.max(1, Math.floor((input - kernel) / effectiveStride + 1))
}

function computePoolOutputDim(input: number, kernel: number, stride: number, padding: number): number {
  const effectiveStride = Math.max(1, stride)
  return Math.max(1, Math.floor((input + 2 * padding - kernel) / effectiveStride + 1))
}

export function graphToArchitecture(
  layers: Record<string, AnyLayer>,
  edges: GraphEdge[]
): TrainingRequest['architecture'] {
  // Build adjacency map for graph traversal
  const adjacency = new Map<string, string>()
  edges.forEach(edge => {
    adjacency.set(edge.target, edge.source)
  })

  // Find input layer (no incoming edges)
  const inputLayer = Object.values(layers).find(
    layer => layer.kind === 'Input' && !edges.some(e => e.target === layer.id)
  )

  if (!inputLayer || inputLayer.kind !== 'Input') {
    throw new Error('No input layer found')
  }

  const {
    size: inputLayerSize,
    channels: inputChannelsParam,
    height: inputHeightParam,
    width: inputWidthParam,
  } = inputLayer.params

  const explicitImageShape: ImageShapeState | undefined =
    inputChannelsParam && inputHeightParam && inputWidthParam
      ? {
          type: 'image',
          channels: inputChannelsParam,
          height: inputHeightParam,
          width: inputWidthParam,
        }
      : undefined

  const productSize =
    explicitImageShape?.channels && explicitImageShape.height && explicitImageShape.width
      ? explicitImageShape.channels * explicitImageShape.height * explicitImageShape.width
      : undefined

  const inputSize = productSize ?? inputLayerSize
  const initialImageShape = explicitImageShape ?? inferImageShapeFromSize(inputSize)
  let currentShape: ShapeState = initialImageShape ?? { type: 'vector', size: inputSize }
  const backendLayers: TrainingRequest['architecture']['layers'] = []

  // Traverse graph in topological order starting from input
  let currentId: string | undefined = inputLayer.id

  while (currentId) {
    const layer = layers[currentId]
    if (!layer) break

    if (layer.kind === 'Input') {
      // Skip adding the input layer itself; move to next
    } else if (layer.kind === 'Dense') {
      currentShape = ensureFlattenLayer(currentShape, backendLayers)
      const units = layer.params.units
      const inputDim = currentShape.size
      backendLayers.push({
        type: 'linear',
        in: inputDim,
        out: units,
      })

      const activation = layer.params.activation
      if (activation && activation !== 'none') {
        backendLayers.push({ type: activation })
      }

      currentShape = { type: 'vector', size: units }
    } else if (layer.kind === 'Convolution') {
      if (currentShape.type === 'vector') {
        const inferred = inferImageShapeFromSize(currentShape.size)
        if (!inferred) {
          throw new Error('Cannot infer image shape for convolution layer input')
        }
        currentShape = inferred
      }

      if (currentShape.type !== 'image') {
        throw new Error('Expected image input for convolution layer')
      }

      const { filters, kernel, stride, padding, activation } = layer.params
      const strideValue = Math.max(1, stride)
      const paddingMode: 'same' | 'valid' = padding === 'same' ? 'same' : 'valid'

      backendLayers.push({
        type: 'conv2d',
        in_channels: currentShape.channels,
        out_channels: filters,
        kernel_size: kernel,
        stride: strideValue,
        padding: paddingMode,
      })

      if (activation && activation !== 'none') {
        backendLayers.push({ type: activation })
      }

      const nextHeight = computeConvOutputDim(currentShape.height, kernel, strideValue, paddingMode)
      const nextWidth = computeConvOutputDim(currentShape.width, kernel, strideValue, paddingMode)

      currentShape = {
        type: 'image',
        channels: filters,
        height: nextHeight,
        width: nextWidth,
      }
    } else if (layer.kind === 'Pooling') {
      if (currentShape.type === 'vector') {
        const inferred = inferImageShapeFromSize(currentShape.size)
        if (!inferred) {
          throw new Error('Cannot infer image shape for pooling layer input')
        }
        currentShape = inferred
      }

      if (currentShape.type !== 'image') {
        throw new Error('Expected image input for pooling layer')
      }

      if (layer.params.type !== 'max') {
        throw new Error(`Unsupported pooling type: ${layer.params.type}`)
      }

      const poolSize = Math.max(1, layer.params.pool_size)
      const strideValue = Math.max(1, layer.params.stride ?? poolSize)
      const paddingValue = Math.max(0, layer.params.padding ?? 0)

      backendLayers.push({
        type: 'maxpool2d',
        kernel_size: poolSize,
        stride: strideValue,
        padding: paddingValue,
      })

      const nextHeight = computePoolOutputDim(currentShape.height, poolSize, strideValue, paddingValue)
      const nextWidth = computePoolOutputDim(currentShape.width, poolSize, strideValue, paddingValue)

      currentShape = {
        type: 'image',
        channels: currentShape.channels,
        height: nextHeight,
        width: nextWidth,
      }
    } else if (layer.kind === 'Flatten') {
      backendLayers.push({ type: 'flatten' })
      if (currentShape.type === 'image') {
        const flattenedSize = currentShape.channels * currentShape.height * currentShape.width
        currentShape = { type: 'vector', size: flattenedSize }
      }
    } else if (layer.kind === 'Dropout') {
      const rate = Math.min(1, Math.max(0, layer.params.rate))
      backendLayers.push({ type: 'dropout', p: rate })
    } else if (layer.kind === 'BatchNorm') {
      if (currentShape.type === 'image') {
        backendLayers.push({ type: 'batchnorm2d', num_features: currentShape.channels })
      } else if (currentShape.type === 'vector') {
        backendLayers.push({ type: 'batchnorm1d', num_features: currentShape.size })
      }
    } else if (layer.kind === 'ResidualBlock') {
      if (currentShape.type !== 'image') {
        throw new Error('ResidualBlock requires image (CHW) input')
      }
      const { filters, kernel } = layer.params
      const k = kernel ?? 3
      backendLayers.push({
        type: 'residual_block',
        in_channels: currentShape.channels,
        out_channels: filters,
        kernel_size: k,
      })
      currentShape = { type: 'image', channels: filters, height: currentShape.height, width: currentShape.width }
    } else if (layer.kind === 'Output') {
      currentShape = ensureFlattenLayer(currentShape, backendLayers)

      const classes = layer.params.classes
      const inputDim = currentShape.size
      backendLayers.push({
        type: 'linear',
        in: inputDim,
        out: classes,
      })

      backendLayers.push({ type: 'softmax' })

      currentShape = { type: 'vector', size: classes }
    }

    // Move to next connected layer
    const nextEdge = edges.find(e => e.source === currentId)
    currentId = nextEdge?.target
  }

  const architecture: TrainingRequest['architecture'] = {
    input_size: inputSize,
    layers: backendLayers,
  }

  if (initialImageShape) {
    architecture.input_channels = initialImageShape.channels
    architecture.input_height = initialImageShape.height
    architecture.input_width = initialImageShape.width
  }

  return architecture
}
