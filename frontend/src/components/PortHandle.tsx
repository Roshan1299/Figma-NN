import { Handle, Position, type HandleProps } from '@xyflow/react'
import { useMemo } from 'react'

interface PortHandleProps extends Omit<HandleProps, 'position' | 'type'> {
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
  const position = useMemo(() => {
    const posMap = {
      top: Position.Top,
      bottom: Position.Bottom,
      left: Position.Left,
      right: Position.Right,
    }
    return posMap[side]
  }, [side])

  // Outer container — 64×64 invisible grab zone centered on the node edge
  const containerStyles: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: '64px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'crosshair',
      zIndex: 10,
    }
    switch (side) {
      case 'top':    return { ...base, top: '-32px',  left: '50%', transform: 'translateX(-50%)' }
      case 'bottom': return { ...base, bottom: '-32px', left: '50%', transform: 'translateX(-50%)' }
      case 'left':   return { ...base, left: '-32px',  top: '50%',  transform: 'translateY(-50%)' }
      case 'right':  return { ...base, right: '-32px', top: '50%',  transform: 'translateY(-50%)' }
      default:       return base
    }
  }, [side])

  const ringColor = isValidTarget
    ? 'border-cyan-500'
    : 'border-red-500'

  const glowColor = isValidTarget
    ? 'group-hover/port:shadow-[0_0_14px_rgba(6,182,212,0.85)]'
    : 'group-hover/port:shadow-[0_0_14px_rgba(239,68,68,0.85)]'

  const bgGlow = isValidTarget
    ? 'group-hover/port:bg-cyan-400/20'
    : 'group-hover/port:bg-red-400/20'

  const isInput = kind === 'input'

  return (
    <div style={containerStyles} className="group/port">
      {/* Subtle radial glow fills the whole grab zone on hover */}
      <div className={`absolute inset-0 rounded-full transition-colors duration-150 ${bgGlow}`} />

      {/* Dot — the Handle lives inside here so the edge connects right at the dot center */}
      <div
        className={`
          relative w-[18px] h-[18px] rounded-full border-2 ${ringColor}
          bg-[#0a0a0a]
          transition-all duration-150
          group-hover/port:scale-125 ${glowColor}
          group-hover/port:border-opacity-100
        `}
      >
        <Handle
          type={isInput ? 'target' : 'source'}
          position={position}
          className="absolute inset-0 opacity-0 rounded-full w-full h-full"
          style={{ minWidth: 'unset', minHeight: 'unset' }}
          {...props}
        />
      </div>
    </div>
  )
}
