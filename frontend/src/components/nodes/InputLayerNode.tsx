import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../store/graphStore';
import type { InputLayer } from '../../types/graph';
import { formatShape } from '../../types/graph';

const DATASET_CLASSES = {
  mnist: 10,
  emnist: 26,
} as const;

export function InputLayerNode({ id }: NodeProps) {
  const layer = useGraphStore(state => state.layers[id]) as InputLayer | undefined;
  const layers = useGraphStore(state => state.layers);
  const updateLayerParams = useGraphStore(state => state.updateLayerParams);

  if (!layer) return null;

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDataset = e.target.value as 'mnist' | 'emnist';
    updateLayerParams(id, { dataset: newDataset });

    // Auto-update output layer classes based on dataset
    const newClasses = DATASET_CLASSES[newDataset];
    const outputLayer = Object.values(layers).find(l => l.kind === 'Output');
    if (outputLayer) {
      updateLayerParams(outputLayer.id, { classes: newClasses });
    }
  };

  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow-lg min-w-40">
      <div className="bg-red-500 text-white px-3 py-1.5 rounded-t-md text-sm font-semibold">
        Input Layer
      </div>

      <div className="p-3 space-y-2">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Size:</span> {layer.params.size}
        </div>

        <div className="text-xs text-gray-600">
          <span className="font-medium">Dataset:</span>
          <select
            value={layer.params.dataset || 'mnist'}
            onChange={handleDatasetChange}
            className="ml-2 text-xs bg-white border border-gray-300 rounded px-1 py-0.5"
          >
            <option value="mnist">MNIST (Digits 0-9)</option>
            <option value="emnist">EMNIST (Letters A-Z)</option>
          </select>
        </div>

        <div className="text-xs text-gray-600">
          <span className="font-medium">Shape:</span> {formatShape(layer.shapeOut)}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="bg-indigo-500! size-5! border-2! border-white! left-[139px]"
      />
    </div>
  );
}
