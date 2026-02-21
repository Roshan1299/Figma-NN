import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useCollabStore } from '@/store/collabStore'
import { useGraphStore } from '@/store/graphStore'
import type { AnyLayer, GraphEdge } from '@/types/graph'

interface GraphOp {
  op_type: string
  payload: Record<string, unknown>
}

let _socket: Socket | null = null

function getClientId(): string {
  const key = 'stitch_client_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

import { API_BASE } from '@/api/marketplace'

function getSocket(): Socket {
  if (!_socket) {
    _socket = io(API_BASE, {
      path: '/socket.io',
      transports: ['polling'],
      auth: { clientId: getClientId() },
    })
  }
  return _socket
}

export function useCollaboration() {
  const isApplyingRemoteRef = useRef(false)
  const lastCursorEmitRef = useRef(0)

  const { setLocalUser, addOrUpdateUser, removeUser, setUserCursor, setAllUsers } = useCollabStore()
  const { addLayer, removeLayer, updateLayerPosition, addEdge, removeEdge, loadGraph } = useGraphStore()

  useEffect(() => {
    const socket = getSocket()

    socket.on('welcome', (data: { userId: string; color: string; name: string; users: Array<{ userId: string; color: string; name: string }> }) => {
      setLocalUser({ userId: data.userId, color: data.color, name: data.name })
      setAllUsers(data.users)
    })

    socket.on('graph_state', (data: { layers: Record<string, AnyLayer>; edges: GraphEdge[] }) => {
      // Only overwrite local graph if server has content (i.e. other users
      // have already built something). If server is empty, keep the local default.
      const hasContent = Object.keys(data.layers).length > 0 || data.edges.length > 0
      if (!hasContent) return

      isApplyingRemoteRef.current = true
      try {
        loadGraph(data.layers, data.edges)
      } finally {
        isApplyingRemoteRef.current = false
      }
    })

    socket.on('user_joined', (data: { userId: string; color: string; name: string }) => {
      addOrUpdateUser({ ...data, cursor: null })
    })

    socket.on('user_left', (data: { userId: string }) => {
      removeUser(data.userId)
    })

    socket.on('graph_op', (data: { userId: string; op_type: string; payload: Record<string, unknown> }) => {
      isApplyingRemoteRef.current = true
      try {
        applyRemoteOp(data.op_type, data.payload, {
          addLayer,
          removeLayer,
          updateLayerPosition,
          addEdge,
          removeEdge,
          loadGraph,
        })
      } finally {
        isApplyingRemoteRef.current = false
      }
    })

    socket.on('cursor_move', (data: { userId: string; x: number; y: number }) => {
      setUserCursor(data.userId, data.x, data.y)
    })

    return () => {
      socket.off('welcome')
      socket.off('graph_state')
      socket.off('user_joined')
      socket.off('user_left')
      socket.off('graph_op')
      socket.off('cursor_move')
    }
  }, [setLocalUser, setAllUsers, addOrUpdateUser, removeUser, setUserCursor, addLayer, removeLayer, updateLayerPosition, addEdge, removeEdge, loadGraph])

  const broadcastOp = useCallback((op: GraphOp) => {
    if (isApplyingRemoteRef.current) return
    getSocket().emit('graph_op', op)
  }, [])

  const broadcastCursor = useCallback((x: number, y: number) => {
    const now = Date.now()
    if (now - lastCursorEmitRef.current < 50) return
    lastCursorEmitRef.current = now
    getSocket().emit('cursor_move', { x, y })
  }, [])

  return { broadcastOp, broadcastCursor }
}

function applyRemoteOp(
  op_type: string,
  payload: Record<string, unknown>,
  actions: {
    addLayer: (layer: AnyLayer) => void
    removeLayer: (id: string) => void
    updateLayerPosition: (id: string, position: { x: number; y: number }) => void
    addEdge: (edge: GraphEdge) => void
    removeEdge: (id: string) => void
    loadGraph: (layers: Record<string, AnyLayer>, edges: GraphEdge[]) => void
  }
) {
  switch (op_type) {
    case 'add_layer': {
      const layer = payload.layer as AnyLayer | undefined
      if (layer) actions.addLayer(layer)
      break
    }
    case 'remove_layer': {
      const id = payload.id as string | undefined
      if (id) actions.removeLayer(id)
      break
    }
    case 'update_layer_position': {
      const id = payload.id as string | undefined
      const position = payload.position as { x: number; y: number } | undefined
      if (id && position) actions.updateLayerPosition(id, position)
      break
    }
    case 'add_edge': {
      const edge = payload.edge as GraphEdge | undefined
      if (edge) actions.addEdge(edge)
      break
    }
    case 'remove_edge': {
      const id = payload.id as string | undefined
      if (id) actions.removeEdge(id)
      break
    }
    case 'load_graph': {
      const layers = payload.layers as Record<string, AnyLayer> | undefined
      const edges = payload.edges as GraphEdge[] | undefined
      if (layers && edges) actions.loadGraph(layers, edges)
      break
    }
  }
}
