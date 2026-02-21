import { useCallback, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { Connection } from '@xyflow/react'

export function ConnectionPreview() {
  const [connection, setConnection] = useState<Connection | null>(null)
  const { getNode, getEdges } = useReactFlow()

  const handleConnect = useCallback((conn: Connection) => {
    setConnection(conn)
  }, [])

  const handleConnectEnd = useCallback(() => {
    setConnection(null)
  }, [])

  if (!connection?.source || !connection?.target) {
    return null
  }

  const sourceNode = getNode(connection.source)
  const targetNode = getNode(connection.target)

  if (!sourceNode?.positionAbsolute || !targetNode?.positionAbsolute) {
    return null
  }

  const sx = sourceNode.positionAbsolute.x + (sourceNode.width ?? 0) / 2
  const sy = sourceNode.positionAbsolute.y + (sourceNode.height ?? 0)
  const tx = targetNode.positionAbsolute.x + (targetNode.width ?? 0) / 2
  const ty = targetNode.positionAbsolute.y

  const pathData = `M ${sx} ${sy} Q ${(sx + tx) / 2} ${(sy + ty) / 2} ${tx} ${ty}`

  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        top: 0,
        left: 0,
      }}
    >
      <path
        d={pathData}
        fill="none"
        stroke="rgba(6, 182, 212, 0.5)"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
    </svg>
  )
}
