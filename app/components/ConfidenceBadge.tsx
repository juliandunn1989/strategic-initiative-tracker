import { ConfidenceLevel, ConfidenceOutcome } from '@/lib/types'

interface ConfidenceBadgeProps {
  label: string
  level: ConfidenceLevel | ConfidenceOutcome | null
  compact?: boolean
}

export default function ConfidenceBadge({ label, level, compact = false }: ConfidenceBadgeProps) {
  const getColor = (level: string | null) => {
    switch (level) {
      case 'excellent':
        return 'bg-emerald-500 text-white shadow-sm'
      case 'good':
        return 'bg-green-500 text-white shadow-sm'
      case 'medium':
        return 'bg-amber-500 text-white shadow-sm'
      case 'poor':
        return 'bg-red-500 text-white shadow-sm'
      case 'na':
        return 'bg-gray-400 text-white shadow-sm'
      default:
        return 'bg-gray-300 text-gray-600'
    }
  }

  const displayLevel = level || 'N/A'

  if (compact) {
    return (
      <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getColor(level)}`}>
        {label}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-600">{label}:</span>
      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getColor(level)}`}>
        {displayLevel}
      </span>
    </div>
  )
}
