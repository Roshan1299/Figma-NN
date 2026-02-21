import { Handle, type HandleProps } from '@xyflow/react'

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
          w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
          transition-all duration-200 cursor-pointer
          ${isValidTarget
            ? isInput
              ? 'bg-cyan-600 border-cyan-400 text-cyan-100 hover:bg-cyan-500 shadow-[0_0_16px_rgba(6,182,212,0.8)] group-hover/handle:shadow-[0_0_24px_rgba(6,182,212,1)]'
              : 'bg-emerald-600 border-emerald-400 text-emerald-100 hover:bg-emerald-500 shadow-[0_0_16px_rgba(34,197,94,0.8)] group-hover/handle:shadow-[0_0_24px_rgba(34,197,94,1)]'
            : 'bg-red-500 border-red-300 text-red-100 hover:bg-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
          }
        `}
      >
        {isInput ? '→' : '←'}
      </Handle>

      {label && (
        <div className="absolute whitespace-nowrap text-sm text-foreground font-bold opacity-0 group-hover/handle:opacity-100 transition-opacity pointer-events-none bg-card/95 px-3 py-1 rounded-md border border-cyan-500 shadow-lg"
          style={{
            [isInput ? 'bottom' : 'top']: '100%',
            [isInput ? 'marginBottom' : 'marginTop']: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
