import { Update, Task } from '@/lib/types'
import { format } from 'date-fns'
import { useState } from 'react'
import ConfidenceBadge from './ConfidenceBadge'
import { getMoodEmoji, getMoodColor } from './EmojiSelector'
import TaskList from './TaskList'

interface TimelineProps {
  updates: (Update & { tasks?: Task[] })[]
}

export default function Timeline({ updates }: TimelineProps) {
  const [showAll, setShowAll] = useState(false)

  const displayedUpdates = showAll ? updates : updates.slice(0, 3)
  const hasMore = updates.length > 3

  return (
    <div className="space-y-4">
      {displayedUpdates.map((update) => (
        <div key={update.id} className="border-l-2 border-gray-200 pl-4 pb-4">
          <div className="text-xs text-gray-500 mb-2">
            {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
          </div>

          {/* Confidence Breakdown */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ConfidenceBadge label="Plan" level={update.confidence_plan} />
            <ConfidenceBadge label="Alignment" level={update.confidence_alignment} />
            <ConfidenceBadge label="Execution" level={update.confidence_execution} />
            <ConfidenceBadge label="Outcomes" level={update.confidence_outcomes} />
          </div>

          {/* Status */}
          {update.latest_status && (
            <div className="mb-3">
              <div className={`text-sm font-medium ${getMoodColor(update.status_mood)}`}>
                {getMoodEmoji(update.status_mood)} {update.latest_status}
              </div>
            </div>
          )}

          {/* Tasks */}
          {update.tasks && update.tasks.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Tasks/Milestones:</h4>
              <TaskList tasks={update.tasks} onTasksChange={() => {}} editable={false} />
            </div>
          )}

          {/* Risk/Worry */}
          {update.biggest_risk_worry && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Biggest Risk/Worry:</h4>
              <p className="text-sm text-gray-600">{update.biggest_risk_worry}</p>
            </div>
          )}

          {/* Department Alignment */}
          <div className="flex flex-wrap gap-2 text-xs">
            {update.dept_product_aligned && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Product ✓</span>
            )}
            {update.dept_tech_aligned && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Tech ✓</span>
            )}
            {update.dept_marketing_aligned && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Marketing ✓</span>
            )}
            {update.dept_client_success_aligned && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Client Success ✓
              </span>
            )}
            {update.dept_commercial_aligned && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Commercial ✓</span>
            )}
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowAll(!showAll)
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAll ? 'Show Less' : 'Load More'}
        </button>
      )}
    </div>
  )
}
