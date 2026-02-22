/**
 * GraphMiniPreview — renders a scaled-down SVG of the actual canvas node graph.
 * Takes raw snapshot layers + edges and draws them at their relative positions,
 * auto-fitted to the container. Mirrors the canvas node colors.
 */

import type { AnyLayer, GraphEdge, LayerKind } from '@/types/graph'

const NODE_COLORS: Record<LayerKind, { bg: string; border: string; text: string }> = {
  Input:         { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  Dense:         { bg: '#0e3a3a', border: '#06b6d4', text: '#67e8f9' },
  Convolution:   { bg: '#3a1f0e', border: '#f97316', text: '#fdba74' },
  Pooling:       { bg: '#2e1a4a', border: '#a855f7', text: '#d8b4fe' },
  Flatten:       { bg: '#2a2a2a', border: '#6b7280', text: '#d1d5db' },
  Dropout:       { bg: '#3a3000', border: '#eab308', text: '#fde047' },
  BatchNorm:     { bg: '#0e2e2a', border: '#14b8a6', text: '#5eead4' },
  ResidualBlock: { bg: '#2a1a3a', border: '#8b5cf6', text: '#c4b5fd' },
  Output:        { bg: '#0e2e1a', border: '#10b981', text: '#6ee7b7' },
}

const LAYER_LABELS: Record<LayerKind, string> = {
  Input: 'In',
  Dense: 'Dense',
  Convolution: 'Conv',
  Pooling: 'Pool',
  Flatten: 'Flat',
  Dropout: 'Drop',
  BatchNorm: 'BN',
  ResidualBlock: 'Res',
  Output: 'Out',
}

interface GraphMiniPreviewProps {
  layers: Record<string, AnyLayer>
  edges: GraphEdge[]
  width?: number
  height?: number
}

const NODE_W = 36
const NODE_H = 22
const PADDING = 10

export function GraphMiniPreview({ layers, edges, width = 220, height = 80 }: GraphMiniPreviewProps) {
  const layerList = Object.values(layers)

  if (layerList.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[10px]"
        style={{ width, height, color: '#555' }}
      >
        Empty
      </div>
    )
  }

  // Compute bounding box of all node positions
  const xs = layerList.map(l => l.position?.x ?? 0)
  const ys = layerList.map(l => l.position?.y ?? 0)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const rawW = maxX - minX || 1
  const rawH = maxY - minY || 1

  // Scale factors to fit within the preview canvas with padding
  const availW = width - PADDING * 2 - NODE_W
  const availH = height - PADDING * 2 - NODE_H
  const scaleX = rawW > 0 ? availW / rawW : 1
  const scaleY = rawH > 0 ? availH / rawH : 1
  const scale = Math.min(scaleX, scaleY, 1)

  // Map a layer's raw position to SVG coords (centered)
  const toSVG = (x: number, y: number) => {
    const scaledW = rawW * scale
    const scaledH = rawH * scale
    const offsetX = PADDING + (availW - scaledW) / 2
    const offsetY = PADDING + (availH - scaledH) / 2
    return {
      x: offsetX + (x - minX) * scale,
      y: offsetY + (y - minY) * scale,
    }
  }

  // Build id -> SVG center map
  const centers: Record<string, { x: number; y: number }> = {}
  for (const layer of layerList) {
    const pos = toSVG(layer.position?.x ?? 0, layer.position?.y ?? 0)
    centers[layer.id] = {
      x: pos.x + NODE_W / 2,
      y: pos.y + NODE_H / 2,
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
    >
      {/* Edges */}
      {edges.map(edge => {
        const src = centers[edge.source]
        const tgt = centers[edge.target]
        if (!src || !tgt) return null
        // Cubic bezier for smooth curve
        const mx = (src.x + tgt.x) / 2
        return (
          <path
            key={edge.id}
            d={`M ${src.x} ${src.y} C ${mx} ${src.y}, ${mx} ${tgt.y}, ${tgt.x} ${tgt.y}`}
            fill="none"
            stroke="#3ecfcf"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        )
      })}

      {/* Nodes */}
      {layerList.map(layer => {
        const pos = toSVG(layer.position?.x ?? 0, layer.position?.y ?? 0)
        const colors = NODE_COLORS[layer.kind]
        const label = LAYER_LABELS[layer.kind]

        return (
          <g key={layer.id}>
            {/* Node box */}
            <rect
              x={pos.x}
              y={pos.y}
              width={NODE_W}
              height={NODE_H}
              rx={4}
              fill={colors.bg}
              stroke={colors.border}
              strokeWidth="1"
              strokeOpacity="0.8"
            />
            {/* Top colored accent line */}
            <rect
              x={pos.x}
              y={pos.y}
              width={NODE_W}
              height={3}
              rx={4}
              fill={colors.border}
              fillOpacity="0.7"
            />
            {/* Label */}
            <text
              x={pos.x + NODE_W / 2}
              y={pos.y + NODE_H / 2 + 4}
              textAnchor="middle"
              fontSize="7"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
              fill={colors.text}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
