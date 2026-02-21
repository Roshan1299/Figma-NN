import { useState, useCallback } from 'react'
import type { Node } from '@xyflow/react'

interface GuideLines {
  vertical: number | null
  horizontal: number | null
}

export function AlignmentGuides() {
  const [guides, setGuides] = useState<GuideLines>({ vertical: null, horizontal: null })

  const SNAP_DISTANCE = 20

  const updateGuides = useCallback((draggedNode: Node, allNodes: Node[]) => {
    const guides: GuideLines = { vertical: null, horizontal: null }

    allNodes.forEach((node) => {
      if (node.id === draggedNode.id) return

      // Check vertical alignment
      if (Math.abs(node.positionAbsolute!.x - draggedNode.positionAbsolute!.x) < SNAP_DISTANCE) {
        guides.vertical = node.positionAbsolute!.x
      }

      // Check horizontal alignment
      if (Math.abs(node.positionAbsolute!.y - draggedNode.positionAbsolute!.y) < SNAP_DISTANCE) {
        guides.horizontal = node.positionAbsolute!.y
      }
    })

    setGuides(guides)
  }, [])

  return (
    <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', top: 0, left: 0 }}>
      {guides.vertical !== null && (
        <line
          x1={guides.vertical}
          y1="0"
          x2={guides.vertical}
          y2="100%"
          stroke="rgba(6, 182, 212, 0.3)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      )}
      {guides.horizontal !== null && (
        <line
          x1="0"
          y1={guides.horizontal}
          x2="100%"
          y2={guides.horizontal}
          stroke="rgba(6, 182, 212, 0.3)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      )}
    </svg>
  )
}
