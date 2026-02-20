import { useCollabStore } from '@/store/collabStore'

export function CollabPresence() {
  const localUser = useCollabStore((s) => s.localUser)
  const remoteUsers = useCollabStore((s) => s.remoteUsers)

  if (!localUser) return null

  const allUsers = [localUser, ...Object.values(remoteUsers)]

  const MAX_VISIBLE = 5
  const visible = allUsers.slice(0, MAX_VISIBLE)
  const overflow = allUsers.length - MAX_VISIBLE

  return (
    <div className="flex items-center gap-1">
      {visible.map((user, index) => {
        const isLocal = user.userId === localUser.userId
        return (
          <div
            key={user.userId}
            title={user.name}
            style={{
              backgroundColor: user.color,
              boxShadow: isLocal ? `0 0 0 2px white, 0 0 0 3px ${user.color}` : undefined,
              zIndex: MAX_VISIBLE - index,
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold relative"
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        )
      })}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-400 text-white text-xs font-bold">
          +{overflow}
        </div>
      )}
    </div>
  )
}
