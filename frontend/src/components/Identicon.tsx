/**
 * Generates a deterministic 5×5 symmetric pixel-grid avatar from a name string.
 * Same name → same pattern + color, every time. No external dependencies.
 */

const PALETTE = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#f43f5e', // rose
  '#10b981', // emerald
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

interface IdenticonProps {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
  ring?: boolean   // adds a white ring (for local user in collab)
  ringColor?: string
}

export function Identicon({ name, size = 32, className, style, ring, ringColor }: IdenticonProps) {
  const hash = hashCode(name || 'anon')
  const color = PALETTE[hash % PALETTE.length]

  // 5×5 grid, 3 unique columns mirrored horizontally
  const ROWS = 5
  const UNIQUE_COLS = 3 // cols 0,1,2 then mirror: col3=col1, col4=col0

  const filled: boolean[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => {
      const mirrorC = c >= UNIQUE_COLS ? 4 - c : c
      const bitIndex = r * UNIQUE_COLS + mirrorC
      return ((hash >> bitIndex) & 1) === 1
    })
  )

  const cellSize = size / 5
  const pad = cellSize * 0.1 // small gap between cells

  const boxShadow = ring
    ? `0 0 0 2px white, 0 0 0 3.5px ${ringColor ?? color}`
    : undefined

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0, boxShadow, ...style }}
    >
      {/* Background */}
      <rect width={size} height={size} fill={`${color}1a`} />

      {/* Grid cells */}
      {filled.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize + pad}
              y={r * cellSize + pad}
              width={cellSize - pad * 2}
              height={cellSize - pad * 2}
              fill={color}
              rx={1.5}
            />
          ) : null
        )
      )}
    </svg>
  )
}
