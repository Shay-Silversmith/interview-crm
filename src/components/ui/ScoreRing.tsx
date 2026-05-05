import { cn } from '@/lib/cn'

interface ScoreRingProps {
  score: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getColor(score: number): { stroke: string; text: string } {
  if (score >= 80) return { stroke: '#10b981', text: 'text-success-700' }
  if (score >= 60) return { stroke: '#f59e0b', text: 'text-warning-700' }
  if (score >= 40) return { stroke: '#6366f1', text: 'text-primary-700' }
  return { stroke: '#94a3b8', text: 'text-slate-500' }
}

const SIZE_CONFIG = {
  sm: { size: 40, strokeWidth: 3.5, textClass: 'text-xs' },
  md: { size: 52, strokeWidth: 4, textClass: 'text-sm' },
  lg: { size: 64, strokeWidth: 4.5, textClass: 'text-base' },
}

export function ScoreRing({ score, label, size = 'md', className }: ScoreRingProps) {
  const { size: svgSize, strokeWidth, textClass } = SIZE_CONFIG[size]
  const { stroke, text } = getColor(score)
  const radius = (svgSize - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center gap-0.5', className)}>
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', textClass, text)}>{score}</span>
        </div>
      </div>
      {label && <span className="text-2xs text-slate-500 font-medium">{label}</span>}
    </div>
  )
}
