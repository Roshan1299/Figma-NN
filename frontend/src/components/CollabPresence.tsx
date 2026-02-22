import { useCollabStore } from '@/store/collabStore'
import { Identicon } from './Identicon'

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
          <div key={user.userId} title={user.name} style={{ zIndex: MAX_VISIBLE - index, position: 'relative' }}>
            <Identicon
              name={user.name}
              size={28}
              ring={isLocal}
            />
          </div>
        )
      })}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 text-white/70 text-[11px] font-semibold border border-white/20">
          +{overflow}
        </div>
      )}
    </div>
  )
}
