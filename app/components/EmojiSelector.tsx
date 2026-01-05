import { StatusMood } from '@/lib/types'

interface EmojiSelectorProps {
  value: StatusMood | null
  onChange: (mood: StatusMood) => void
  disabled?: boolean
}

const moods: { value: StatusMood; emoji: string; label: string }[] = [
  { value: 'great', emoji: '🎉', label: 'Great' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'concerned', emoji: '😟', label: 'Concerned' },
  { value: 'warning', emoji: '⚠️', label: 'Warning' },
]

export default function EmojiSelector({ value, onChange, disabled }: EmojiSelectorProps) {
  return (
    <div className="flex gap-3">
      {moods.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) onChange(mood.value)
          }}
          disabled={disabled}
          className={`text-4xl transition-all transform ${
            value === mood.value ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
          } hover:opacity-100 hover:scale-110 disabled:cursor-not-allowed`}
          title={mood.label}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  )
}

export function getMoodColor(mood: StatusMood | null): string {
  switch (mood) {
    case 'great':
      return 'text-green-700'
    case 'good':
      return 'text-green-600'
    case 'neutral':
      return 'text-gray-600'
    case 'concerned':
      return 'text-amber-700'
    case 'warning':
      return 'text-amber-600'
    default:
      return 'text-gray-500'
  }
}

export function getMoodEmoji(mood: StatusMood | null): string {
  const found = moods.find((m) => m.value === mood)
  return found ? found.emoji : '😐'
}
