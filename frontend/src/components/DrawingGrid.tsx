import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'

interface DrawingGridProps {
  width?: number
  height?: number
  scale?: number
  eraseMode?: boolean
  onDrawingComplete?: (pixels: number[][]) => void
}

export interface DrawingGridRef {
  clear: () => void
}

export const DrawingGrid = forwardRef<DrawingGridRef, DrawingGridProps>(
  function DrawingGrid({ width = 28, height = 28, scale = 10, eraseMode = false, onDrawingComplete }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)
    const scaleFactor = scale

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = width
      canvas.height = height
      canvas.style.width = `${width * scaleFactor}px`
      canvas.style.height = `${height * scaleFactor}px`
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = 'white'
      setContext(ctx)
    }, [width, height, scaleFactor])

    // Keep fillStyle in sync with eraseMode
    useEffect(() => {
      if (!context) return
      context.fillStyle = eraseMode ? 'black' : 'white'
    }, [eraseMode, context])

    const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !context || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const scaleX = width / rect.width
      const scaleY = height / rect.height
      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY
      context.fillRect(x - 1, y - 1, 3, 3)
    }, [isDrawing, context, width, height])

    const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true)
      draw(event)
    }, [draw])

    const stopDrawing = useCallback(() => {
      setIsDrawing(false)
      if (onDrawingComplete && context) {
        const imageData = context.getImageData(0, 0, width, height)
        const pixels: number[][] = []
        for (let y = 0; y < height; y++) {
          pixels[y] = []
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            pixels[y][x] = imageData.data[i]
          }
        }
        onDrawingComplete(pixels)
      }
    }, [context, width, height, onDrawingComplete])

    const clearCanvas = useCallback(() => {
      if (!context) return
      context.fillStyle = 'black'
      context.fillRect(0, 0, width, height)
      context.fillStyle = eraseMode ? 'black' : 'white'
    }, [context, width, height, eraseMode])

    useImperativeHandle(ref, () => ({ clear: clearCanvas }), [clearCanvas])

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        className={eraseMode ? 'cursor-cell' : 'cursor-crosshair'}
        style={{ imageRendering: 'pixelated', display: 'block' }}
      />
    )
  }
)
