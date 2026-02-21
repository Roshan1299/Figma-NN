# Neural Network Assembling UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the neural network diagram assembling experience with enhanced handles, smooth dragging, real-time validation feedback, and polished visuals.

**Architecture:** Create a custom handle system layer on top of React Flow that provides enhanced visuals and validation states. Optimize React Flow performance settings. Add connection preview rendering and validation feedback system. Enhance node styling with subtle hover/selection states.

**Tech Stack:** React Flow (@xyflow/react), React hooks, Tailwind CSS, existing useGraphStore and validation logic

---

## Task 1: Create Custom Handle Component with Enhanced Visuals

**Files:**
- Create: `frontend/src/components/CustomHandle.tsx`
- Modify: `frontend/src/components/nodes/DenseLayerNode.tsx` (update imports)
- Modify: `frontend/src/components/nodes/InputLayerNode.tsx` (update imports)
- Modify: `frontend/src/components/nodes/OutputLayerNode.tsx` (update imports)
- Modify: `frontend/src/components/nodes/ConvLayerNode.tsx` (update imports)
- Modify: `frontend/src/components/nodes/PoolingLayerNode.tsx` (update imports)
- Modify: `frontend/src/components/nodes/FlattenLayerNode.tsx` (update imports)
- Modify: `frontend/src/components/nodes/DropoutLayerNode.tsx` (update imports)

**Step 1: Create CustomHandle component**

Create `frontend/src/components/CustomHandle.tsx`:

```typescript
import { Handle, Position, type HandleProps } from '@xyflow/react'
import { ReactNode } from 'react'

interface CustomHandleProps extends HandleProps {
  label?: string
  isValidTarget?: boolean
}

export function CustomHandle({
  type,
  position,
  id,
  label,
  isValidTarget = true,
  ...props
}: CustomHandleProps) {
  const isInput = type === 'target'

  return (
    <div className="group/handle relative">
      <Handle
        type={type}
        position={position}
        id={id}
        {...props}
        className={`
          w-3 h-3 rounded-full border-2 border-background
          transition-all duration-200
          ${isValidTarget
            ? 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] group-hover/handle:shadow-[0_0_12px_rgba(6,182,212,0.8)]'
            : 'bg-red-500 hover:bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
          }
        `}
      />

      {label && (
        <div className="absolute whitespace-nowrap text-xs text-muted-foreground opacity-0 group-hover/handle:opacity-100 transition-opacity pointer-events-none font-medium bg-card/80 px-2 py-0.5 rounded border border-border"
          style={{
            [isInput ? 'bottom' : 'top']: '100%',
            [isInput ? 'marginBottom' : 'marginTop']: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Update DenseLayerNode to use CustomHandle**

Modify `frontend/src/components/nodes/DenseLayerNode.tsx`:

```typescript
import { CustomHandle } from '../CustomHandle'
import { Position, type NodeProps } from '@xyflow/react'
import { useGraphStore } from '../../store/graphStore'
import type { DenseLayer } from '../../types/graph'

export function DenseLayerNode({ id, selected }: NodeProps) {
  const layer = useGraphStore((state) => state.layers[id]) as DenseLayer | undefined
  const removeLayer = useGraphStore((state) => state.removeLayer)

  if (!layer) return null

  return (
    <div className={`relative bg-card border ${selected ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-border shadow-sm'} rounded-xl min-w-[180px] flex items-center p-3 gap-3 transition-all hover:border-cyan-500/50 group`}>
      <div className="w-8 h-8 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      </div>

      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-foreground leading-tight">Dense</span>
        <span className="text-[11px] text-muted-foreground mt-0.5 leading-none">{layer.params.units} units</span>
      </div>

      <button
        type="button"
        onClick={() => removeLayer(id)}
        className="absolute -right-2 -top-2 w-5 h-5 flex items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
      >
        ×
      </button>

      <CustomHandle type="target" position={Position.Top} id="input" label="Input" />
      <CustomHandle type="source" position={Position.Bottom} id="output" label="Output" />
    </div>
  )
}
```

**Step 3: Update all other layer nodes similarly**

Update `frontend/src/components/nodes/InputLayerNode.tsx`, `OutputLayerNode.tsx`, `ConvLayerNode.tsx`, `PoolingLayerNode.tsx`, `FlattenLayerNode.tsx`, `DropoutLayerNode.tsx` to use `CustomHandle` with appropriate labels.

**Step 4: Verify handles render correctly**

Run: `npm run dev`
Expected: App loads, all nodes show larger, glowing cyan handles on top and bottom

**Step 5: Commit**

```bash
git add frontend/src/components/CustomHandle.tsx frontend/src/components/nodes/
git commit -m "Add custom handle component with enhanced visuals"
```

---

## Task 2: Enhance Node Hover and Selection States

**Files:**
- Modify: `frontend/src/components/nodes/DenseLayerNode.tsx`
- Modify: `frontend/src/components/nodes/InputLayerNode.tsx`
- Modify: `frontend/src/components/nodes/OutputLayerNode.tsx`
- Modify: `frontend/src/components/nodes/ConvLayerNode.tsx`
- Modify: `frontend/src/components/nodes/PoolingLayerNode.tsx`
- Modify: `frontend/src/components/nodes/FlattenLayerNode.tsx`
- Modify: `frontend/src/components/nodes/DropoutLayerNode.tsx`

**Step 1: Update DenseLayerNode with enhanced hover/selection**

Modify `frontend/src/components/nodes/DenseLayerNode.tsx` node container:

```typescript
<div className={`
  relative bg-card border rounded-xl min-w-[180px] flex items-center p-3 gap-3
  transition-all duration-200 group
  ${selected
    ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
    : 'border-border shadow-sm hover:shadow-md hover:border-cyan-500/50'
  }
`}>
```

**Step 2: Apply same pattern to all other layer nodes**

Update all layer node files with the enhanced hover and selection styling.

**Step 3: Test hover and selection states**

Run: `npm run dev`
Expected: Nodes have smooth shadows on hover, bright cyan glow when selected

**Step 4: Commit**

```bash
git add frontend/src/components/nodes/
git commit -m "Enhance node hover and selection visual states"
```

---

## Task 3: Optimize React Flow Configuration for Smooth Dragging

**Files:**
- Modify: `frontend/src/routes/Playground.tsx` (lines 1-200)

**Step 1: Find React Flow configuration in Playground**

Read: `frontend/src/routes/Playground.tsx` to find ReactFlow props.

**Step 2: Add performance optimization props to ReactFlow**

Find the `<ReactFlow>` component and add/modify these props:

```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}

  // Performance optimizations
  selectNodesOnDrag={false}
  multiSelectionKeyCode="shift"
  panOnDrag={true}
  panOnScroll={false}
  zoomOnScroll={true}
  zoomOnPinch={true}

  // Snap to grid (optional, can disable if too constraining)
  snapToGrid={false}
  snapGrid={[20, 20]}
>
```

**Step 3: Test dragging feel**

Run: `npm run dev`
Expected: Dragging nodes feels snappy, responsive, no lag

**Step 4: Commit**

```bash
git add frontend/src/routes/Playground.tsx
git commit -m "Optimize React Flow config for smooth dragging"
```

---

## Task 4: Add Node Drag Shadow Effect

**Files:**
- Create: `frontend/src/hooks/useNodeDragState.ts`
- Modify: `frontend/src/routes/Playground.tsx`

**Step 1: Create hook to track drag state**

Create `frontend/src/hooks/useNodeDragState.ts`:

```typescript
import { useCallback } from 'react'
import type { Node } from '@xyflow/react'

export function useNodeDragState(setNodes: Function) {
  const onNodeDragStart = useCallback((event: any, node: Node) => {
    // Enhance shadow while dragging
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
    // Remove drag shadow
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
```

**Step 2: Update layer nodes to use isDragging state**

Modify all layer node files to use isDragging data:

```typescript
export function DenseLayerNode({ id, selected, data }: NodeProps) {
  // ... existing code ...

  return (
    <div className={`
      relative bg-card border rounded-xl min-w-[180px] flex items-center p-3 gap-3
      transition-all duration-200 group
      ${data?.isDragging
        ? 'shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
        : selected
        ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
        : 'border-border shadow-sm hover:shadow-md'
      }
    `}>
```

**Step 3: Add hook to Playground**

In `frontend/src/routes/Playground.tsx`, add to the component:

```typescript
const { onNodeDragStart, onNodeDragStop } = useNodeDragState(setNodes)

// Add to ReactFlow:
<ReactFlow
  // ... existing props ...
  onNodeDragStart={onNodeDragStart}
  onNodeDragStop={onNodeDragStop}
>
```

**Step 4: Test drag shadow effect**

Run: `npm run dev`
Expected: Dragging a node shows enhanced shadow, makes it feel lifted

**Step 5: Commit**

```bash
git add frontend/src/hooks/useNodeDragState.ts frontend/src/routes/Playground.tsx frontend/src/components/nodes/
git commit -m "Add shadow depth effect during node dragging"
```

---

## Task 5: Implement Connection Preview Line

**Files:**
- Create: `frontend/src/components/ConnectionPreview.tsx`
- Modify: `frontend/src/routes/Playground.tsx`
- Modify: `frontend/src/store/graphStore.ts`

**Step 1: Create ConnectionPreview component**

Create `frontend/src/components/ConnectionPreview.tsx`:

```typescript
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
```

**Step 2: Add ConnectionPreview to Playground**

In `frontend/src/routes/Playground.tsx`, add the component inside ReactFlow:

```typescript
<ReactFlow
  // ... existing props ...
>
  <Background />
  <Controls />
  <ConnectionPreview />
</ReactFlow>
```

**Step 3: Test preview line**

Run: `npm run dev`
Expected: When hovering over a handle and dragging, a dashed cyan line appears

**Step 4: Commit**

```bash
git add frontend/src/components/ConnectionPreview.tsx frontend/src/routes/Playground.tsx
git commit -m "Add connection preview line during drag"
```

---

## Task 6: Add Real-Time Connection Validation Feedback

**Files:**
- Modify: `frontend/src/routes/Playground.tsx` (onConnect handler)
- Modify: `frontend/src/lib/shapeInference.ts` (enhance validation)

**Step 1: Enhance shape validation with detailed messages**

Read `frontend/src/lib/shapeInference.ts` and `frontend/src/routes/Playground.tsx` to understand current validation.

**Step 2: Update onConnect handler to show validation feedback**

In `frontend/src/routes/Playground.tsx`, find the onConnect handler and enhance it:

```typescript
const onConnect = useCallback(
  (connection: Connection) => {
    const isValid = validateConnection(connection, graphStore)

    if (!isValid) {
      const sourceNode = graphStore.layers[connection.source!]
      const targetNode = graphStore.layers[connection.target!]
      const errorMsg = `Cannot connect ${sourceNode?.kind} to ${targetNode?.kind}`

      notifyConnectionError(errorMsg)
      return
    }

    // Existing connection logic
    graphStore.addEdge(connection)
    setEdges((eds) => [...eds, connection as Edge])
  },
  [graphStore]
)
```

**Step 3: Add visual feedback for invalid connections**

Enhance the CustomHandle component to check validation on hover:

In `frontend/src/components/CustomHandle.tsx`, add validation color change:

```typescript
const isValidConnection = validateConnectionTarget(nodeId, handleId, type)

<CustomHandle
  isValidTarget={isValidConnection}
  // ... other props
/>
```

**Step 4: Test validation feedback**

Run: `npm run dev`
Expected: Invalid connection attempts show red handle and toast error

**Step 5: Commit**

```bash
git add frontend/src/routes/Playground.tsx frontend/src/lib/shapeInference.ts
git commit -m "Add real-time connection validation feedback"
```

---

## Task 7: Add Optional Grid Background

**Files:**
- Create: `frontend/src/components/GridBackground.tsx`
- Modify: `frontend/src/routes/Playground.tsx`

**Step 1: Create GridBackground component**

Create `frontend/src/components/GridBackground.tsx`:

```typescript
import { Background, BackgroundVariant } from '@xyflow/react'

export function GridBackground() {
  return (
    <Background
      variant={BackgroundVariant.Dots}
      gap={20}
      size={1}
      color="rgba(255, 255, 255, 0.05)"
    />
  )
}
```

**Step 2: Add GridBackground to Playground**

In `frontend/src/routes/Playground.tsx`:

```typescript
<ReactFlow>
  <GridBackground />
  <Background />
  <Controls />
</ReactFlow>
```

**Step 3: Test grid visibility**

Run: `npm run dev`
Expected: Subtle dots grid visible in background

**Step 4: Commit**

```bash
git add frontend/src/components/GridBackground.tsx frontend/src/routes/Playground.tsx
git commit -m "Add subtle grid background to canvas"
```

---

## Task 8: Add Alignment Guides on Drag

**Files:**
- Create: `frontend/src/components/AlignmentGuides.tsx`
- Modify: `frontend/src/routes/Playground.tsx`

**Step 1: Create AlignmentGuides component**

Create `frontend/src/components/AlignmentGuides.tsx`:

```typescript
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
```

**Step 2: Add AlignmentGuides to Playground**

In `frontend/src/routes/Playground.tsx`:

```typescript
<ReactFlow>
  <GridBackground />
  <Background />
  <AlignmentGuides />
  <Controls />
</ReactFlow>
```

**Step 3: Test alignment guides**

Run: `npm run dev`
Expected: Faint cyan dashed lines appear when dragging nodes near others

**Step 4: Commit**

```bash
git add frontend/src/components/AlignmentGuides.tsx frontend/src/routes/Playground.tsx
git commit -m "Add alignment guides when dragging nodes"
```

---

## Task 9: Enhance Edge Styling and Hover States

**Files:**
- Modify: `frontend/src/routes/Playground.tsx` (edge styling)

**Step 1: Update edge default style**

In `frontend/src/routes/Playground.tsx`, find where edges are created/rendered and add:

```typescript
const edgeOptions = {
  animated: true,
  style: {
    stroke: 'rgba(6, 182, 212, 0.6)',
    strokeWidth: 2,
  },
  markerEnd: { type: 'arrowclosed', color: 'rgba(6, 182, 212, 0.6)' },
}
```

**Step 2: Apply smooth curve routing**

Ensure edges use `smoothstep` interpolation (React Flow default). Verify in ReactFlow config.

**Step 3: Test edge styling**

Run: `npm run dev`
Expected: Edges are cyan, animated, with smooth curves

**Step 4: Commit**

```bash
git add frontend/src/routes/Playground.tsx
git commit -m "Enhance edge styling with smooth curves and animation"
```

---

## Task 10: Testing and Polish

**Files:**
- Test: Manually verify all improvements

**Step 1: Comprehensive manual testing**

Run: `npm run dev`

Checklist:
- [ ] Handles are 8-10px, glowing cyan, with tooltips on hover
- [ ] Handles have pulsing glow effect
- [ ] Nodes have subtle shadow on hover
- [ ] Nodes have bright cyan glow when selected
- [ ] Dragging feels snappy and responsive
- [ ] Drag shadow effect visible
- [ ] Connection preview line appears when dragging from handle
- [ ] Invalid connections show red feedback
- [ ] Toast errors appear for invalid connections
- [ ] Grid background subtle in canvas
- [ ] Alignment guides appear on drag
- [ ] Edges are cyan, smooth, animated

**Step 2: Performance check**

Run: `npm run dev`
- Drag multiple nodes rapidly
- Create many connections
- Verify no lag or jank

Expected: Smooth performance even with complex diagrams

**Step 3: Browser dev tools**

Open Chrome DevTools, ensure:
- No console errors
- No warnings about React hooks
- Network requests normal

**Step 4: Build test**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 5: Final commit**

```bash
git add .
git commit -m "Polish and verify all UX improvements working"
```

---

## Verification Checklist

✅ Custom handles with enhanced styling and tooltips
✅ Node hover and selection state improvements
✅ React Flow config optimized for smooth dragging
✅ Drag shadow effect on nodes
✅ Connection preview line during drag
✅ Real-time validation feedback
✅ Grid background on canvas
✅ Alignment guides on drag
✅ Enhanced edge styling
✅ No console errors
✅ Build succeeds
✅ All features working as designed

---

## Cleanup

After implementation and testing:
1. Delete design document: `docs/plans/2026-02-20-assembling-ux-design.md`
2. Keep implementation plan: `docs/plans/2026-02-20-assembling-ux-implementation.md` for reference only
3. Verify git history has clean, descriptive commits
