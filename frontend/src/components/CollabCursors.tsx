import { useStore } from '@xyflow/react'
import { useCollabStore } from '@/store/collabStore'

export function CollabCursors() {
  const transform = useStore((s) => s.transform)
  const remoteUsers = useCollabStore((s) => s.remoteUsers)

  const [tx, ty, scale] = transform

  return (
    <>
      {Object.values(remoteUsers).map((user) => {
        if (!user.cursor) return null
        const sx = user.cursor.x * scale + tx
        const sy = user.cursor.y * scale + ty

        return (
          <div
            key={user.userId}
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 0L0 16L4.5 11.5L7.5 18L9.5 17L6.5 10L13 10L0 0Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 18,
                left: 10,
                backgroundColor: user.color,
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {user.name}
            </div>
          </div>
        )
      })}
    </>
  )
}
