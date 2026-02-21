import { Handle, Position, type HandleProps } from '@xyflow/react'
import { useMemo } from 'react'

interface PortHandleProps extends Omit<HandleProps, 'position'> {
  side: 'top' | 'bottom' | 'left' | 'right'
  kind: 'input' | 'output'
  isValidTarget?: boolean
}

export function PortHandle({
  side,
  kind,
  isValidTarget = true,
  ...props
}: PortHandleProps) {
  // Map side to React Flow Position
  const position = useMemo(() => {
    const posMap = {
      top: Position.Top,
      bottom: Position.Bottom,
      left: Position.Left,
      right: Position.Right,
    }
    return posMap[side]
  }, [side])

  // Styling for port container (absolute positioning relative to node)
  const containerStyles: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'grab',
    }

    // Position based on side
    switch (side) {
      case 'top':
        return { ...base, top: '-24px', left: '50%', transform: 'translateX(-50%)' }
      case 'bottom':
        return { ...base, bottom: '-24px', left: '50%', transform: 'translateX(-50%)' }
      case 'left':
        return { ...base, left: '-24px', top: '50%', transform: 'translateY(-50%)' }
      case 'right':
        return { ...base, right: '-24px', top: '50%', transform: 'translateY(-50%)' }
      default:
        return base
    }
  }, [side])

  // Color scheme based on kind and validation state
  const isInput = kind === 'input'
  const colorClass = useMemo(() => {
    if (!isValidTarget) {
      return 'text-red-500 before:bg-red-500 before:shadow-[0_0_12px_rgba(239,68,68,0.6)] hover:before:shadow-[0_0_16px_rgba(239,68,68,0.8)]'
    }

    if (isInput) {
      return 'text-cyan-500 before:bg-cyan-500 before:shadow-[0_0_12px_rgba(6,182,212,0.6)] hover:before:shadow-[0_0_20px_rgba(6,182,212,0.9)]'
    } else {
      return 'text-emerald-500 before:bg-emerald-500 before:shadow-[0_0_12px_rgba(34,197,94,0.6)] hover:before:shadow-[0_0_20px_rgba(34,197,94,0.9)]'
    }
  }, [isInput, isValidTarget])

  return (
    <div style={containerStyles} className={`group/port ${colorClass}`}>
      {/* Invisible large hit target */}
      <div className="absolute inset-0 rounded-full opacity-0 hover:opacity-10 bg-current transition-opacity" />

      {/* Visible port circle "tip" */}
      <div className="relative w-4 h-4 rounded-full before:absolute before:inset-0 before:rounded-full before:border-2 before:border-background before:transition-all before:duration-200 group-hover/port:before:scale-125">
        <Handle
          type={isInput ? 'target' : 'source'}
          position={position}
          {...props}
          className="w-4 h-4 opacity-0"
        />
      </div>
    </div>
  )
}
