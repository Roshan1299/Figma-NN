import type { AnyLayer, GraphEdge } from '@/types/graph'

export type PresetType = 'blank' | 'simple' | 'complex' | 'deep_mlp' | 'lenet' | 'resnet_lite'

interface PresetChipsProps {
  onPresetSelect: (preset: PresetType) => void
}

export function PresetChips({ onPresetSelect }: PresetChipsProps) {
  const baseClasses =
    'px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer border backdrop-blur-sm'

  return (
    <div className="px-3 py-2 flex gap-2 items-center pointer-events-auto">
      <span className="text-xs font-semibold text-gray-600">Preset:</span>
      <button
        onClick={() => onPresetSelect('blank')}
        className={
          `${baseClasses} bg-blue-50/80 text-blue-700 hover:bg-blue-100 border-blue-200/50`
        }
      >
        Blank
      </button>
      <button
        onClick={() => onPresetSelect('simple')}
        className={
          `${baseClasses} bg-blue-50/80 text-blue-700 hover:bg-blue-100 border-blue-200/50`
        }
      >
        Simple
      </button>
      <button
        onClick={() => onPresetSelect('complex')}
        className={
          `${baseClasses} bg-blue-50/80 text-blue-700 hover:bg-blue-100 border-blue-200/50`
        }
      >
        Complex
      </button>
      <button
        onClick={() => onPresetSelect('deep_mlp')}
        className={
          `${baseClasses} bg-violet-50/80 text-violet-700 hover:bg-violet-100 border-violet-200/50`
        }
      >
        Deep MLP
      </button>
      <button
        onClick={() => onPresetSelect('lenet')}
        className={
          `${baseClasses} bg-violet-50/80 text-violet-700 hover:bg-violet-100 border-violet-200/50`
        }
      >
        LeNet
      </button>
      <button
        onClick={() => onPresetSelect('resnet_lite')}
        className={
          `${baseClasses} bg-violet-50/80 text-violet-700 hover:bg-violet-100 border-violet-200/50`
        }
      >
        ResNet Lite
      </button>
    </div>
  )
}

// Preset definitions
export function getPresetGraph(preset: PresetType): {
  layers: Record<string, AnyLayer>
  edges: GraphEdge[]
} {
  const makeEdge = (id: string, source: string, target: string): GraphEdge => ({
    id,
    source,
    target,
    sourceHandle: 'output',
    targetHandle: 'input',
  })

  switch (preset) {
    case 'blank':
      return {
        layers: {
          'input-1': {
            id: 'input-1',
            kind: 'Input',
            params: { size: 784, channels: 1, height: 28, width: 28, dataset: 'mnist' },
            position: { x: 50, y: 200 },
          },
          'flatten-1': {
            id: 'flatten-1',
            kind: 'Flatten',
            params: {},
            position: { x: 430, y: 200 },
          },
          'output-1': {
            id: 'output-1',
            kind: 'Output',
            params: { classes: 10, activation: 'softmax' }, // Default to MNIST classes
            position: { x: 810, y: 200 },
          },
        },
        edges: [
          makeEdge('input-1-flatten-1', 'input-1', 'flatten-1'),
          makeEdge('flatten-1-output-1', 'flatten-1', 'output-1'),
        ],
      }

    case 'simple':
      return {
        layers: {
          'input-1': {
            id: 'input-1',
            kind: 'Input',
            params: { size: 784, channels: 1, height: 28, width: 28, dataset: 'mnist' },
            position: { x: 50, y: 200 },
          },
          'flatten-1': {
            id: 'flatten-1',
            kind: 'Flatten',
            params: {},
            position: { x: 430, y: 200 },
          },
          'dense-1': {
            id: 'dense-1',
            kind: 'Dense',
            params: { units: 128, activation: 'relu' },
            position: { x: 810, y: 200 },
          },
          'output-1': {
            id: 'output-1',
            kind: 'Output',
            params: { classes: 10, activation: 'softmax' }, // Default to MNIST classes
            position: { x: 1190, y: 200 },
          },
        },
        edges: [
          makeEdge('input-1-flatten-1', 'input-1', 'flatten-1'),
          makeEdge('flatten-1-dense-1', 'flatten-1', 'dense-1'),
          makeEdge('dense-1-output-1', 'dense-1', 'output-1'),
        ],
      }

    case 'complex':
      return {
        layers: {
          'input-1': {
            id: 'input-1',
            kind: 'Input',
            params: { size: 784, channels: 1, height: 28, width: 28, dataset: 'mnist' },
            position: { x: 50, y: 200 },
          },
          'conv-1': {
            id: 'conv-1',
            kind: 'Convolution',
            params: { filters: 32, kernel: 3, stride: 1, padding: 'same', activation: 'relu' },
            position: { x: 430, y: 200 },
          },
          'batchnorm-1': {
            id: 'batchnorm-1',
            kind: 'BatchNorm',
            params: {},
            position: { x: 810, y: 200 },
          },
          'pool-1': {
            id: 'pool-1',
            kind: 'Pooling',
            params: { type: 'max', pool_size: 2, stride: 2, padding: 0 },
            position: { x: 1190, y: 200 },
          },
          'conv-2': {
            id: 'conv-2',
            kind: 'Convolution',
            params: { filters: 64, kernel: 3, stride: 1, padding: 'same', activation: 'relu' },
            position: { x: 1570, y: 200 },
          },
          'batchnorm-2': {
            id: 'batchnorm-2',
            kind: 'BatchNorm',
            params: {},
            position: { x: 1950, y: 200 },
          },
          'pool-2': {
            id: 'pool-2',
            kind: 'Pooling',
            params: { type: 'max', pool_size: 2, stride: 2, padding: 0 },
            position: { x: 2330, y: 200 },
          },
          'flatten-1': {
            id: 'flatten-1',
            kind: 'Flatten',
            params: {},
            position: { x: 2710, y: 200 },
          },
          'dense-1': {
            id: 'dense-1',
            kind: 'Dense',
            params: { units: 128, activation: 'relu' },
            position: { x: 3090, y: 200 },
          },
          'dropout-1': {
            id: 'dropout-1',
            kind: 'Dropout',
            params: { rate: 0.5 },
            position: { x: 3470, y: 200 },
          },
          'output-1': {
            id: 'output-1',
            kind: 'Output',
            params: { classes: 10, activation: 'softmax' },
            position: { x: 3850, y: 200 },
          },
        },
        edges: [
          makeEdge('input-1-conv-1', 'input-1', 'conv-1'),
          makeEdge('conv-1-batchnorm-1', 'conv-1', 'batchnorm-1'),
          makeEdge('batchnorm-1-pool-1', 'batchnorm-1', 'pool-1'),
          makeEdge('pool-1-conv-2', 'pool-1', 'conv-2'),
          makeEdge('conv-2-batchnorm-2', 'conv-2', 'batchnorm-2'),
          makeEdge('batchnorm-2-pool-2', 'batchnorm-2', 'pool-2'),
          makeEdge('pool-2-flatten-1', 'pool-2', 'flatten-1'),
          makeEdge('flatten-1-dense-1', 'flatten-1', 'dense-1'),
          makeEdge('dense-1-dropout-1', 'dense-1', 'dropout-1'),
          makeEdge('dropout-1-output-1', 'dropout-1', 'output-1'),
        ],
      }

    // Deep MLP: Input → Flatten → Dense(256) → BN → Dropout → Dense(128) → BN → Dropout → Output
    case 'deep_mlp':
      return {
        layers: {
          'input-1':    { id: 'input-1',    kind: 'Input',    params: { size: 784, channels: 1, height: 28, width: 28, dataset: 'mnist' }, position: { x: 50,   y: 200 } },
          'flatten-1':  { id: 'flatten-1',  kind: 'Flatten',  params: {},                                                                   position: { x: 430,  y: 200 } },
          'dense-1':    { id: 'dense-1',    kind: 'Dense',    params: { units: 256, activation: 'relu' },                                   position: { x: 810,  y: 200 } },
          'batchnorm-1':{ id: 'batchnorm-1',kind: 'BatchNorm',params: {},                                                                   position: { x: 1190, y: 200 } },
          'dropout-1':  { id: 'dropout-1',  kind: 'Dropout',  params: { rate: 0.4 },                                                        position: { x: 1570, y: 200 } },
          'dense-2':    { id: 'dense-2',    kind: 'Dense',    params: { units: 128, activation: 'relu' },                                   position: { x: 1950, y: 200 } },
          'batchnorm-2':{ id: 'batchnorm-2',kind: 'BatchNorm',params: {},                                                                   position: { x: 2330, y: 200 } },
          'dropout-2':  { id: 'dropout-2',  kind: 'Dropout',  params: { rate: 0.3 },                                                        position: { x: 2710, y: 200 } },
          'output-1':   { id: 'output-1',   kind: 'Output',   params: { classes: 10, activation: 'softmax' },                               position: { x: 3090, y: 200 } },
        },
        edges: [
          makeEdge('e1', 'input-1',    'flatten-1'),
          makeEdge('e2', 'flatten-1',  'dense-1'),
          makeEdge('e3', 'dense-1',    'batchnorm-1'),
          makeEdge('e4', 'batchnorm-1','dropout-1'),
          makeEdge('e5', 'dropout-1',  'dense-2'),
          makeEdge('e6', 'dense-2',    'batchnorm-2'),
          makeEdge('e7', 'batchnorm-2','dropout-2'),
          makeEdge('e8', 'dropout-2',  'output-1'),
        ],
      }

    // LeNet-5 style: Input → Conv(6,5) → Pool → Conv(16,5) → Pool → Flatten → Dense(120) → Dense(84) → Output
    case 'lenet':
      return {
        layers: {
          'input-1':   { id: 'input-1',   kind: 'Input',       params: { size: 784, channels: 1, height: 28, width: 28, dataset: 'mnist' },                        position: { x: 50,   y: 200 } },
          'conv-1':    { id: 'conv-1',    kind: 'Convolution', params: { filters: 6,  kernel: 5, stride: 1, padding: 'same', activation: 'relu' },                 position: { x: 430,  y: 200 } },
          'pool-1':    { id: 'pool-1',    kind: 'Pooling',     params: { type: 'max', pool_size: 2, stride: 2, padding: 0 },                                       position: { x: 810,  y: 200 } },
          'conv-2':    { id: 'conv-2',    kind: 'Convolution', params: { filters: 16, kernel: 5, stride: 1, padding: 'valid', activation: 'relu' },                position: { x: 1190, y: 200 } },
          'pool-2':    { id: 'pool-2',    kind: 'Pooling',     params: { type: 'max', pool_size: 2, stride: 2, padding: 0 },                                       position: { x: 1570, y: 200 } },
          'flatten-1': { id: 'flatten-1', kind: 'Flatten',     params: {},                                                                                          position: { x: 1950, y: 200 } },
          'dense-1':   { id: 'dense-1',   kind: 'Dense',       params: { units: 120, activation: 'relu' },                                                         position: { x: 2330, y: 200 } },
          'dense-2':   { id: 'dense-2',   kind: 'Dense',       params: { units: 84,  activation: 'relu' },                                                         position: { x: 2710, y: 200 } },
          'output-1':  { id: 'output-1',  kind: 'Output',      params: { classes: 10, activation: 'softmax' },                                                     position: { x: 3090, y: 200 } },
        },
        edges: [
          makeEdge('e1', 'input-1',   'conv-1'),
          makeEdge('e2', 'conv-1',    'pool-1'),
          makeEdge('e3', 'pool-1',    'conv-2'),
          makeEdge('e4', 'conv-2',    'pool-2'),
          makeEdge('e5', 'pool-2',    'flatten-1'),
          makeEdge('e6', 'flatten-1', 'dense-1'),
          makeEdge('e7', 'dense-1',   'dense-2'),
          makeEdge('e8', 'dense-2',   'output-1'),
        ],
      }

    // ResNet Lite: Input → Conv → BN → Pool → ResBlock → ResBlock → Flatten → Dense → Output
    case 'resnet_lite':
      return {
        layers: {
          'input-1':    { id: 'input-1',    kind: 'Input',         params: { size: 784, channels: 1, height: 28, width: 28, dataset: 'mnist' },       position: { x: 50,   y: 200 } },
          'conv-1':     { id: 'conv-1',     kind: 'Convolution',   params: { filters: 32, kernel: 3, stride: 1, padding: 'same', activation: 'relu' }, position: { x: 430,  y: 200 } },
          'batchnorm-1':{ id: 'batchnorm-1',kind: 'BatchNorm',     params: {},                                                                          position: { x: 810,  y: 200 } },
          'pool-1':     { id: 'pool-1',     kind: 'Pooling',       params: { type: 'max', pool_size: 2, stride: 2, padding: 0 },                       position: { x: 1190, y: 200 } },
          'resblock-1': { id: 'resblock-1', kind: 'ResidualBlock', params: { filters: 32, kernel: 3 },                                                  position: { x: 1570, y: 200 } },
          'resblock-2': { id: 'resblock-2', kind: 'ResidualBlock', params: { filters: 64, kernel: 3 },                                                  position: { x: 1950, y: 200 } },
          'flatten-1':  { id: 'flatten-1',  kind: 'Flatten',       params: {},                                                                          position: { x: 2330, y: 200 } },
          'dense-1':    { id: 'dense-1',    kind: 'Dense',         params: { units: 128, activation: 'relu' },                                          position: { x: 2710, y: 200 } },
          'dropout-1':  { id: 'dropout-1',  kind: 'Dropout',       params: { rate: 0.4 },                                                               position: { x: 3090, y: 200 } },
          'output-1':   { id: 'output-1',   kind: 'Output',        params: { classes: 10, activation: 'softmax' },                                      position: { x: 3470, y: 200 } },
        },
        edges: [
          makeEdge('e1', 'input-1',    'conv-1'),
          makeEdge('e2', 'conv-1',     'batchnorm-1'),
          makeEdge('e3', 'batchnorm-1','pool-1'),
          makeEdge('e4', 'pool-1',     'resblock-1'),
          makeEdge('e5', 'resblock-1', 'resblock-2'),
          makeEdge('e6', 'resblock-2', 'flatten-1'),
          makeEdge('e7', 'flatten-1',  'dense-1'),
          makeEdge('e8', 'dense-1',    'dropout-1'),
          makeEdge('e9', 'dropout-1',  'output-1'),
        ],
      }
  }
}
