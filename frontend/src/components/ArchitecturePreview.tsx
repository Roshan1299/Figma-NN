/**
 * Mini architecture diagram for marketplace cards.
 * Renders the backend layer list as a horizontal chain of colored boxes with connecting lines.
 * No interactivity — purely visual.
 */

interface ArchitectureLayer {
  type: string
  [key: string]: any
}

interface ArchitecturePreviewProps {
  architecture: Record<string, any>
}

// Map backend layer types to display names and colors
const LAYER_STYLE: Record<string, { label: string; bg: string; border: string; text: string }> = {
  conv2d:    { label: 'Conv',    bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-300' },
  maxpool2d: { label: 'Pool',    bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   text: 'text-blue-300' },
  linear:    { label: 'Dense',   bg: 'bg-red-500/20',    border: 'border-red-500/40',     text: 'text-red-300' },
  flatten:   { label: 'Flat',    bg: 'bg-amber-500/20',  border: 'border-amber-500/40',   text: 'text-amber-300' },
  dropout:     { label: 'Drop',    bg: 'bg-gray-500/20',   border: 'border-gray-500/40',    text: 'text-gray-300' },
  batchnorm2d: { label: 'BN',     bg: 'bg-teal-500/20',   border: 'border-teal-500/40',    text: 'text-teal-300' },
  batchnorm1d: { label: 'BN',     bg: 'bg-teal-500/20',   border: 'border-teal-500/40',    text: 'text-teal-300' },
  residual_block: { label: 'Res', bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300' },
  relu:        { label: 'ReLU',   bg: 'bg-green-500/15',  border: 'border-green-500/30',   text: 'text-green-400' },
  softmax:     { label: 'Soft',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30',    text: 'text-cyan-400' },
}

function getStyle(type: string) {
  return LAYER_STYLE[type] ?? { label: type, bg: 'bg-white/10', border: 'border-white/20', text: 'text-white/70' }
}

// Collapse activation layers (relu/softmax) that follow immediately after dense/conv into the preceding node
function collapseActivations(layers: ArchitectureLayer[]): { type: string; detail?: string }[] {
  const collapsed: { type: string; detail?: string }[] = []
  const activations = new Set(['relu', 'sigmoid', 'tanh', 'softmax', 'leaky_relu'])

  for (let i = 0; i < layers.length; i++) {
    const l = layers[i]
    if (activations.has(l.type)) {
      // Merge into previous if it exists
      if (collapsed.length > 0) {
        collapsed[collapsed.length - 1].detail = l.type
      }
    } else {
      collapsed.push({ type: l.type })
    }
  }
  return collapsed
}

export function ArchitecturePreview({ architecture }: ArchitecturePreviewProps) {
  const rawLayers: ArchitectureLayer[] = architecture?.layers ?? []
  if (rawLayers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
        No layers
      </div>
    )
  }

  const nodes = [
    { type: 'input', detail: undefined },
    ...collapseActivations(rawLayers),
  ]

  return (
    <div className="flex items-center gap-0 px-2 py-3 overflow-hidden">
      {nodes.map((node, i) => {
        const style = node.type === 'input'
          ? { label: 'Input', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300' }
          : getStyle(node.type)

        return (
          <div key={i} className="flex items-center shrink-0">
            {i > 0 && (
              <div className="w-3 h-px bg-white/20 shrink-0" />
            )}
            <div
              className={`${style.bg} ${style.border} border rounded-md px-1.5 py-1 flex flex-col items-center justify-center`}
            >
              <span className={`text-[9px] font-semibold leading-none ${style.text}`}>
                {style.label}
              </span>
              {node.detail && (
                <span className="text-[7px] text-white/40 leading-none mt-0.5">
                  {node.detail}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
