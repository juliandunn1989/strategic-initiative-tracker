import { Milestone } from '@/lib/types'
import { format } from 'date-fns'

interface MilestoneListProps {
  milestones: Milestone[]
  onMilestonesChange: (milestones: Milestone[]) => void
  editable?: boolean
}

export default function MilestoneList({
  milestones,
  onMilestonesChange,
  editable = false,
}: MilestoneListProps) {
  const handleMilestoneTextChange = (index: number, text: string) => {
    const newMilestones = [...milestones]
    newMilestones[index].milestone_text = text
    onMilestonesChange(newMilestones)
  }

  const handleMilestoneDateChange = (index: number, date: string) => {
    const newMilestones = [...milestones]
    newMilestones[index].target_date = date
    onMilestonesChange(newMilestones)
  }

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      update_id: '',
      milestone_text: '',
      target_date: null,
      display_order: milestones.length,
    }
    onMilestonesChange([...milestones, newMilestone])
  }

  const handleRemoveMilestone = (index: number) => {
    const newMilestones = milestones.filter((_, i) => i !== index)
    onMilestonesChange(newMilestones)
  }

  return (
    <div className="space-y-2">
      {milestones.map((milestone, index) => (
        <div key={milestone.id || index} className="flex gap-2 items-start">
          {editable ? (
            <>
              <input
                type="text"
                value={milestone.milestone_text}
                onChange={(e) => {
                  e.stopPropagation()
                  handleMilestoneTextChange(index, e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Milestone name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <input
                type="date"
                value={milestone.target_date || ''}
                onChange={(e) => {
                  e.stopPropagation()
                  handleMilestoneDateChange(index, e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveMilestone(index)
                }}
                className="text-red-500 hover:text-red-700 text-lg"
              >
                ✕
              </button>
            </>
          ) : (
            <div className="flex-1">
              <span className="text-sm text-gray-700">{milestone.milestone_text}</span>
              {milestone.target_date && (
                <span className="text-xs text-gray-500 ml-2">
                  ({format(new Date(milestone.target_date), 'MMM d, yyyy')})
                </span>
              )}
            </div>
          )}
        </div>
      ))}
      {editable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleAddMilestone()
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add Milestone
        </button>
      )}
    </div>
  )
}
