import type { FC } from 'react'
import { memo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MetricData } from '@/api/types'

interface MetricsChartsProps {
  metrics: MetricData[]
}

const GRID_COLOR = 'rgba(255,255,255,0.05)'
const AXIS_COLOR = 'rgba(255,255,255,0.25)'
const TOOLTIP_STYLE = {
  backgroundColor: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 11,
  color: '#f3f4f6',
}

export const MetricsCharts: FC<MetricsChartsProps> = memo(({ metrics }) => {
  if (metrics.length <= 1) return null

  return (
    <div className="space-y-4">
      {/* Loss */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Loss</p>
        <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={metrics} margin={{ top: 10, right: 12, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#f3f4f6' }}
                labelStyle={{ color: AXIS_COLOR, fontSize: 10 }}
                formatter={(v: number) => v.toFixed(4)}
              />
              <Line type="monotone" dataKey="train_loss" stroke="#f87171" name="Train" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="val_loss" stroke="#60a5fa" name="Val" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-1 pl-1">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: '#f87171' }} /><span className="text-[10px] text-muted-foreground">Train</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: '#60a5fa' }} /><span className="text-[10px] text-muted-foreground">Val</span></div>
        </div>
      </div>

      {/* Accuracy */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Accuracy</p>
        <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={metrics} margin={{ top: 10, right: 12, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
              <YAxis
                domain={[0, 1]}
                tick={{ fontSize: 10, fill: AXIS_COLOR }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: '#f3f4f6' }}
                labelStyle={{ color: AXIS_COLOR, fontSize: 10 }}
                formatter={(v: number) => `${(v * 100).toFixed(2)}%`}
              />
              <Line type="monotone" dataKey="train_accuracy" stroke="#34d399" name="Train" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="val_accuracy" stroke="#a78bfa" name="Val" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-1 pl-1">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: '#34d399' }} /><span className="text-[10px] text-muted-foreground">Train</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: '#a78bfa' }} /><span className="text-[10px] text-muted-foreground">Val</span></div>
        </div>
      </div>
    </div>
  )
})

MetricsCharts.displayName = 'MetricsCharts'
