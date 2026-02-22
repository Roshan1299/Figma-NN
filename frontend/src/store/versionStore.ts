import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnyLayer, GraphEdge } from '../types/graph'

const MAX_VERSIONS = 30

export interface Version {
  id: string
  name: string
  timestamp: number
  snapshot: { layers: Record<string, AnyLayer>; edges: GraphEdge[] }
  layerCount: number
  layerSummary: string
}

interface VersionStore {
  versions: Version[]
  saveVersion: (name: string, layers: Record<string, AnyLayer>, edges: GraphEdge[]) => string
  deleteVersion: (id: string) => void
  renameVersion: (id: string, name: string) => void
  clearAllVersions: () => void
}

/** Walk edges from root (Input) to build "Kind > Kind > ..." summary. */
export function buildLayerSummary(layers: Record<string, AnyLayer>, edges: GraphEdge[]): string {
  const targetSet = new Set(edges.map(e => e.target))
  const sourceMap = new Map(edges.map(e => [e.source, e.target]))

  // Root = layer that appears as a source (or exists) but never as a target
  let rootId: string | undefined
  for (const id of Object.keys(layers)) {
    if (!targetSet.has(id)) {
      rootId = id
      break
    }
  }

  if (!rootId) {
    // Fallback: just list layer kinds
    const kinds = Object.values(layers).map(l => l.kind)
    return kinds.join(' > ') || 'Empty'
  }

  const chain: string[] = []
  let currentId: string | undefined = rootId
  const visited = new Set<string>()

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const layer = layers[currentId]
    if (layer) chain.push(layer.kind)
    currentId = sourceMap.get(currentId)
  }

  return chain.join(' > ') || 'Empty'
}

export const useVersionStore = create<VersionStore>()(
  persist(
    (set) => ({
      versions: [],

      saveVersion: (name, layers, edges) => {
        const id = crypto.randomUUID()
        const snapshot = JSON.parse(JSON.stringify({ layers, edges }))
        const layerCount = Object.keys(layers).length
        const layerSummary = buildLayerSummary(layers, edges)

        const version: Version = {
          id,
          name,
          timestamp: Date.now(),
          snapshot,
          layerCount,
          layerSummary,
        }

        set((state) => {
          const updated = [version, ...state.versions].slice(0, MAX_VERSIONS)
          return { versions: updated }
        })

        return id
      },

      deleteVersion: (id) =>
        set((state) => ({
          versions: state.versions.filter((v) => v.id !== id),
        })),

      renameVersion: (id, name) =>
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === id ? { ...v, name } : v
          ),
        })),

      clearAllVersions: () => set({ versions: [] }),
    }),
    {
      name: 'stitch-version-history',
      partialize: (state) => ({ versions: state.versions }),
    }
  )
)
