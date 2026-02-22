import { DrawingGrid } from '@/components/DrawingGrid'
import type { DrawingGridRef } from '@/components/DrawingGrid'
import { NetworkVisualization } from '@/components/NetworkVisualization'
import { useModel, useModels } from '@/hooks/useModels'
import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function Test() {
  const { modelId } = useParams<{ modelId?: string }>()
  const navigate = useNavigate()
  const { data: models, isLoading, isError, error } = useModels()
  const [selectedModelId, setSelectedModelId] = useState<string>(() => modelId ?? '')
  const [currentDrawing, setCurrentDrawing] = useState<number[][]>()
  const [isRunning, setIsRunning] = useState(false)
  const [prediction, setPrediction] = useState<number | null>(null)
  const [eraseMode, setEraseMode] = useState(false)
  const drawingGridRef = useRef<DrawingGridRef>(null)

  const selectedModel = models?.find(m => m.model_id === selectedModelId)
  const { data: selectedModelDetail } = useModel(selectedModelId)
  const succeededRuns = useMemo(() => {
    if (!selectedModelDetail?.runs) return []
    return [...selectedModelDetail.runs]
      .filter((run) => run.state === 'succeeded')
      .sort((a, b) => {
        const aTime = new Date(a.completed_at ?? a.created_at ?? 0).getTime()
        const bTime = new Date(b.completed_at ?? b.created_at ?? 0).getTime()
        return bTime - aTime
      })
  }, [selectedModelDetail])

  const latestRunId = succeededRuns.length > 0 ? succeededRuns[0].run_id : ''

  useEffect(() => {
    if (modelId) {
      setSelectedModelId(modelId)
    } else {
      setSelectedModelId('')
    }
  }, [modelId])

  useEffect(() => {
    if (selectedModelId) {
      if (selectedModelId !== modelId) {
        navigate(`/test/${selectedModelId}`, { replace: true })
      }
    } else if (modelId) {
      navigate('/test', { replace: true })
    }
  }, [selectedModelId, modelId, navigate])

  const flattenDrawing = (grid?: number[][]): number[] | null => {
    if (!grid || grid.length === 0 || grid[0]?.length === 0) return null
    const flattened: number[] = []
    for (const row of grid) {
      for (const value of row) {
        const numeric = Number.isFinite(value) ? value : 0
        const normalized = Math.min(1, Math.max(0, numeric / 255))
        flattened.push(normalized)
      }
    }
    if (flattened.length !== 784) return null
    return flattened
  }

  const flattenedPixels = useMemo(() => flattenDrawing(currentDrawing), [currentDrawing])

  const handleInference = async () => {
    const flattened = flattenedPixels
    const runId = latestRunId
    if (!flattened || !runId) return
    setIsRunning(true)
    try {
      const response = await fetch('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId, pixels: flattened }),
      })
      if (!response.ok) throw new Error('Failed to run inference')
      const data = await response.json()
      const detected = typeof data?.label === 'number' ? data.label : null
      setPrediction(detected)
    } catch (err) {
      console.error('Inference failed:', err)
    } finally {
      setIsRunning(false)
    }
  }

  const handleClear = () => {
    drawingGridRef.current?.clear()
    setCurrentDrawing(undefined)
    setPrediction(null)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Loading models…
    </div>
  )

  if (isError) return (
    <div className="flex items-center justify-center h-full text-red-400 text-sm">
      {error.message}
    </div>
  )

  const latestRun = selectedModelDetail?.runs?.find(run => run.run_id === latestRunId)
  const datasetType = latestRun?.hyperparams?.dataset_type || 'mnist'

  const predictionLabel = prediction !== null
    ? datasetType === 'emnist'
      ? String.fromCharCode(65 + Math.max(0, Math.min(25, prediction)))
      : String.fromCharCode(48 + Math.max(0, Math.min(9, prediction)))
    : null

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel */}
      <div className="w-[300px] shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card/30">
        <div className="px-4 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Test Model</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Draw on the canvas and run inference</p>
        </div>

        {/* Model selector */}
        <div className="px-4 py-3.5 border-b border-border">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Model
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => { setSelectedModelId(e.target.value); setPrediction(null) }}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">Select a model…</option>
            {models?.map((model) => (
              <option key={model.model_id} value={model.model_id}>
                {model.name}
              </option>
            ))}
          </select>
          {selectedModelId && !latestRunId && (
            <p className="text-[11px] text-yellow-500/70 mt-1.5">No successful runs for this model yet</p>
          )}
        </div>

        {/* Drawing canvas */}
        <div className="px-4 py-4 border-b border-border flex flex-col items-center gap-3">
          <div
            className="rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.4)]"
            style={{ lineHeight: 0 }}
          >
            <DrawingGrid
              ref={drawingGridRef}
              eraseMode={eraseMode}
              onDrawingComplete={(pixels) => {
                setCurrentDrawing(pixels)
                setPrediction(null)
              }}
            />
          </div>

          {/* Tool buttons */}
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setEraseMode(v => !v)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                eraseMode
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 20H7L3 16l13-13 7 7-3 3z"/><path d="M6 17l5-5"/>
              </svg>
              Erase
            </button>
            <button
              onClick={handleClear}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Clear
            </button>
          </div>
        </div>

        {/* Run inference + result */}
        <div className="px-4 py-4 flex flex-col gap-3">
          <button
            onClick={handleInference}
            disabled={!selectedModelId || !latestRunId || !flattenedPixels || isRunning}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white shadow-[0_0_16px_rgba(139,92,246,0.25)] hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            {isRunning ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Run Inference
              </>
            )}
          </button>

          {predictionLabel !== null && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-5 text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Prediction</p>
              <span className="text-6xl font-bold text-primary tracking-tight">{predictionLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Network Visualization */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Network Visualization</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Input pixels, hidden layers, and output neurons</p>
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedModel ? (
            <NetworkVisualization
              layers={selectedModel.architecture?.layers ?? []}
              currentDrawing={currentDrawing}
              activeOutput={prediction}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <p className="text-sm text-muted-foreground">Select a model to see the network</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
