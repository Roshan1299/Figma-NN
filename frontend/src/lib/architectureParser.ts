import type { AnyLayer, GraphEdge, ActivationType } from '../types/graph';

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function parseArchitectureToGraph(arch: any): { layers: Record<string, AnyLayer>; edges: GraphEdge[] } {
  const resultLayers: Record<string, AnyLayer> = {};
  const resultEdges: GraphEdge[] = [];

  let currentX = 50;
  let currentY = 250;
  let prevId: string | null = null;

  const addLayer = (layer: AnyLayer) => {
    resultLayers[layer.id] = layer;
    if (prevId) {
      resultEdges.push({
        id: `${prevId}->${layer.id}`,
        source: prevId,
        target: layer.id,
      });
    }
    prevId = layer.id;
    currentX += 300;
  };

  // 1. Input Layer
  const inputId = generateId('input');
  
  // Try to determine dataset from shape
  let dataset: 'mnist' | 'emnist' = arch.input_channels ? 'mnist' : 'emnist';
  if (arch.layers) {
    const lastLayer = arch.layers[arch.layers.length - 2]; 
    // Usually linear then softmax
    // Check classes to guess dataset
    if (lastLayer && lastLayer.type === 'linear') {
      if (lastLayer.out === 26) dataset = 'emnist';
      else if (lastLayer.out === 10) dataset = 'mnist';
    }
  }

  // Handle 1D to 2D Fallback for imports missing explicit dimensions
  const size = arch.input_size || 784;
  let channels = arch.input_channels;
  let height = arch.input_height;
  let width = arch.input_width;

  if (size === 784 && (!channels || !height || !width)) {
    channels = 1;
    height = 28;
    width = 28;
  }

  addLayer({
    id: inputId,
    kind: 'Input',
    params: {
        size: size,
        channels: channels,
        height: height,
        width: width,
        dataset: dataset,
    },
    position: { x: currentX, y: currentY }
  });

  const rawLayers = arch.layers || [];
  let i = 0;

  while (i < rawLayers.length) {
    const l = rawLayers[i];

    // Lookahead for activation
    const nextL = (i + 1 < rawLayers.length) ? rawLayers[i + 1] : null;
    let activation: ActivationType = 'none';

    if (nextL && (nextL.type === 'relu' || nextL.type === 'sigmoid' || nextL.type === 'tanh')) {
      activation = nextL.type;
    }

    if (l.type === 'conv2d') {
      const convId = generateId('conv');
      addLayer({
        id: convId,
        kind: 'Convolution',
        params: {
          filters: l.out_channels || 32,
          kernel: l.kernel_size || 3,
          stride: l.stride || 1,
          padding: l.padding || 'valid',
          activation: activation as Exclude<ActivationType, 'softmax'>
        },
        position: { x: currentX, y: currentY }
      });
      if (activation !== 'none') i++; // Skip the activation layer
    } 
    else if (l.type === 'maxpool2d') {
      const poolId = generateId('pool');
      addLayer({
        id: poolId,
        kind: 'Pooling',
        params: {
          type: 'max',
          pool_size: l.kernel_size || 2,
          stride: l.stride !== undefined ? l.stride : 2,
          padding: l.padding || 0
        },
        position: { x: currentX, y: currentY }
      });
    }
    else if (l.type === 'flatten') {
      const flatId = generateId('flatten');
      addLayer({
        id: flatId,
        kind: 'Flatten',
        params: {},
        position: { x: currentX, y: currentY }
      });
    }
    else if (l.type === 'dropout') {
      const dropId = generateId('dropout');
      addLayer({
        id: dropId,
        kind: 'Dropout',
        params: { rate: l.p || 0.5 },
        position: { x: currentX, y: currentY }
      });
    }
    else if (l.type === 'batchnorm2d' || l.type === 'batchnorm1d') {
      const bnId = generateId('batchnorm');
      addLayer({
        id: bnId,
        kind: 'BatchNorm',
        params: {},
        position: { x: currentX, y: currentY }
      });
    }
    else if (l.type === 'residual_block') {
      const resId = generateId('resblock');
      addLayer({
        id: resId,
        kind: 'ResidualBlock',
        params: { filters: l.out_channels || 64, kernel: l.kernel_size || 3 },
        position: { x: currentX, y: currentY }
      });
    }
    else if (l.type === 'linear') {
      // Check if it's output
      let isOutput = false;
      if (nextL && nextL.type === 'softmax') {
         isOutput = true;
      }
      
      if (isOutput) {
        const outId = generateId('output');
        addLayer({
          id: outId,
          kind: 'Output',
          params: { classes: l.out || 10, activation: 'softmax' },
          position: { x: currentX, y: currentY }
        });
        i++; // skip softmax
      } else {
        const denseId = generateId('dense');
        addLayer({
          id: denseId,
          kind: 'Dense',
          params: { units: l.out || 128, activation: activation },
          position: { x: currentX, y: currentY }
        });
        if (activation !== 'none') i++; // skip activation
      }
    }
    i++;
  }

  return { layers: resultLayers, edges: resultEdges };
}
