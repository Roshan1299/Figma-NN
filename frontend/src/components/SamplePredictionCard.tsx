import type { FC } from 'react'
import { memo } from 'react'
import type { EmnistSample } from '@/api/types'

interface SamplePredictionCardProps {
  sample: EmnistSample
  datasetType?: 'mnist' | 'emnist'
}

const renderSampleGrid = (grid: number[][]) => (
  <div
    className="grid"
    style={{
      gridTemplateColumns: 'repeat(28, 1fr)',
      gridAutoRows: '1fr',
      width: '112px',
      height: '112px',
      gap: '0',
    }}
  >
    {grid.map((row, rowIndex) =>
      row.map((value, columnIndex) => {
        const shade = Math.max(0, Math.min(255, value))
        return (
          <div
            key={`${rowIndex}-${columnIndex}`}
            style={{
              backgroundColor: `rgb(${shade}, ${shade}, ${shade})`,
              width: '100%',
              height: '100%',
            }}
          />
        )
      })
    )}
  </div>
)

export const SamplePredictionCard: FC<SamplePredictionCardProps> = memo(({ sample, datasetType = 'mnist' }) => {
  const isIncorrect = sample.prediction !== sample.label
  
  // Convert numeric indices to appropriate characters based on dataset type
  const getCharacterLabel = (index: number) => {
    if (datasetType === 'emnist') {
      // EMNIST: indices 0-25 correspond to letters A-Z
      return String.fromCharCode(65 + Math.max(0, Math.min(25, index)));
    } else {
      // MNIST: indices 0-9 correspond to digits 0-9
      return String.fromCharCode(48 + Math.max(0, Math.min(9, index)));
    }
  };

  const trueLabelChar = getCharacterLabel(sample.label);
  const predLabelChar = getCharacterLabel(sample.prediction);

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-lg border p-3 shadow-sm transition-all ${
        isIncorrect
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {renderSampleGrid(sample.grid)}
      <div className="text-xs text-gray-700 text-center space-y-1">
        <div>
          <span className="font-semibold text-gray-900">True:</span> {trueLabelChar}
        </div>
        <div className={isIncorrect ? 'text-red-700 font-semibold' : ''}>
          <span className="font-semibold text-gray-900">Pred:</span> {predLabelChar}
        </div>
        {typeof sample.confidence === 'number' && (
          <div>
            <span className="font-semibold text-gray-900">Confidence:</span>{' '}
            {(sample.confidence * 100).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  )
})

SamplePredictionCard.displayName = 'SamplePredictionCard'
