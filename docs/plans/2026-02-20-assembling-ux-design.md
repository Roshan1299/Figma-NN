# Neural Network Assembling UX Improvement - Design Document

**Date:** February 20, 2026
**Scope:** Improve the diagram assembling experience in Figma-NN
**Priority:** Smooth dragging, connection feedback, handle visibility

---

## Overview

This design improves the user experience when building neural network diagrams. The focus is on making the process intuitive, responsive, and visually clear through enhanced handles, smooth interactions, real-time validation feedback, and polished visuals.

---

## Design Sections

### 1. Handle System & Visibility

**Custom Enhanced Handles:**
- Replace default React Flow handles with larger, more visible ports (8-10px instead of 2.5px)
- Implement two-state system:
  - **Normal:** Subtle, semi-transparent cyan circles
  - **Hover:** Bright, animated glow with pulsing border
- Position handles slightly outside the node for easier targeting
- Visual distinctions: input handles (top) and output handles (bottom) with different styles

**Port Labels & Tooltips:**
- Show brief tooltips on hover: "Connect output" / "Connect input"
- Highlight handle receptiveness with color (valid targets glow brighter)

**Outcome:** Users immediately see connection points; handles are easy to target.

---

### 2. Smooth Dragging & Movement

**Performance Optimization:**
- Optimize React Flow config (panOnDrag, zoom sensitivity)
- Reduce re-render overhead during drag with memoization
- Implement momentum-based panning for responsive feel

**Node Movement Feel:**
- Nodes follow cursor instantly without lag
- Subtle shadow depth changes while dragging (lifting effect)
- Optional snap-to-grid (20px grid) for alignment
- Optional magnetic alignment guides showing faint snap lines

**Outcome:** Dragging feels snappy, responsive, and intentional.

---

### 3. Connection Feedback & Real-Time Validation

**Preview Connection Line:**
- Hovering over handle shows preview line extending to cursor
- Dragging to connect animates line smoothly showing potential path
- Line color indicates validation:
  - **Green/Cyan:** Valid connection
  - **Red/Orange:** Invalid connection
  - Shows error message: "Conv output incompatible with Dense input"

**Visual Validation Feedback:**
- Target handle highlights in green (valid) or dims in red (invalid)
- Target node glows to indicate valid drop zone
- Invalid connection shows toast with reason
- Smooth edge animation on connection creation
- Optional flash confirmation on new edge

**Outcome:** Users always know if they can connect before releasing; no surprises.

---

### 4. Visual Polish & Canvas Experience

**Node Visual Improvements:**
- Subtle hover state: nodes lift slightly (box-shadow depth increase)
- Clear selection state: bright cyan glow + stronger border
- Prominent node type icons
- Consistent padding/sizing for alignment

**Canvas & Guides:**
- Optional subtle grid background for mental positioning
- Alignment guides appear when dragging near other nodes
- Mini-compass in corner for orientation during pan/zoom

**Edge/Connection Visual:**
- Smooth curves for polished look (not sharp angles)
- Edge color matches validation state during creation
- Hovered edges highlight to show connection relationships

**Overall Aesthetic:**
- Minimal, non-cluttered design
- Consistent cyan (#06B6D4) accent (established)
- Dark mode consistency

**Outcome:** Professional, organized, enjoyable canvas experience.

---

## Technical Approach

**Technology Stack:**
- React Flow (keep existing)
- Custom handle components with enhanced styling
- React hooks for state management (existing useGraphStore)
- Tailwind CSS for styling

**Key Changes:**
1. Create custom Handle wrapper component with enhanced visuals
2. Optimize React Flow configuration for performance
3. Add connection validation preview with line rendering
4. Enhance node styling and hover states
5. Add optional grid/guides overlay
6. Implement connection validation feedback system

**No Breaking Changes:**
- Maintains existing layer structure
- Preserves current API
- Backwards compatible with saved models

---

## Success Criteria

✅ Handles are visibly prominent and easy to target (8-10px, glowing on hover)
✅ Node dragging is snappy and responsive (no perceptible lag)
✅ Connection preview shows before releasing (clear visual feedback)
✅ Invalid connections are prevented with visual indication
✅ Canvas feels professional and minimal (no visual clutter)
✅ All existing functionality preserved

---

## Implementation Phases

1. **Phase 1:** Custom handle system + visual enhancements
2. **Phase 2:** Dragging performance optimization + movement feel
3. **Phase 3:** Connection validation + preview feedback
4. **Phase 4:** Canvas polish + optional guides/grid
