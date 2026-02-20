import { create } from 'zustand'

export interface RemoteUser {
  userId: string
  color: string
  name: string
  cursor: { x: number; y: number } | null
}

export interface LocalUser {
  userId: string
  color: string
  name: string
}

interface CollabState {
  localUser: LocalUser | null
  remoteUsers: Record<string, RemoteUser>

  setLocalUser: (user: LocalUser) => void
  addOrUpdateUser: (user: RemoteUser) => void
  removeUser: (userId: string) => void
  setUserCursor: (userId: string, x: number, y: number) => void
  setAllUsers: (users: Array<{ userId: string; color: string; name: string }>) => void
  reset: () => void
}

export const useCollabStore = create<CollabState>((set) => ({
  localUser: null,
  remoteUsers: {},

  setLocalUser: (user) => set({ localUser: user }),

  addOrUpdateUser: (user) =>
    set((state) => ({
      remoteUsers: {
        ...state.remoteUsers,
        [user.userId]: { ...state.remoteUsers[user.userId], ...user },
      },
    })),

  removeUser: (userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.remoteUsers
      return { remoteUsers: rest }
    }),

  setUserCursor: (userId, x, y) =>
    set((state) => {
      const existing = state.remoteUsers[userId]
      if (!existing) return state
      return {
        remoteUsers: {
          ...state.remoteUsers,
          [userId]: { ...existing, cursor: { x, y } },
        },
      }
    }),

  setAllUsers: (users) =>
    set((state) => {
      const remoteUsers: Record<string, RemoteUser> = {}
      users.forEach((u) => {
        remoteUsers[u.userId] = {
          ...u,
          cursor: state.remoteUsers[u.userId]?.cursor ?? null,
        }
      })
      return { remoteUsers }
    }),

  reset: () => set({ localUser: null, remoteUsers: {} }),
}))
