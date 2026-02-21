import { useCallback } from 'react'
import type { Node } from '@xyflow/react'

export function useNodeDragState(setNodes: (updater: (nodes: Node[]) => Node[]) => void) {
  const onNodeDragStart = useCallback((event: any, node: Node) => {
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === node.id
          ? {
              ...n,
              data: { ...n.data, isDragging: true },
            }
          : n
      )
    )
  }, [setNodes])

  const onNodeDragStop = useCallback((event: any, node: Node) => {
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === node.id
          ? {
              ...n,
              data: { ...n.data, isDragging: false },
            }
          : n
      )
    )
  }, [setNodes])

  return { onNodeDragStart, onNodeDragStop }
}
