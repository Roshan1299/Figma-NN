import { Handle, Position, type HandleProps } from '@xyflow/react'

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
