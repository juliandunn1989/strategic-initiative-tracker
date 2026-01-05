'use client'

import { useState, useEffect } from 'react'
import { Initiative, Update, Task, ConfidenceLevel, ConfidenceOutcome, StatusMood } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { formatWorkingDaysUntil } from '@/lib/utils'
import ConfidenceBadge from './ConfidenceBadge'
import EmojiSelector, { getMoodEmoji, getMoodColor } from './EmojiSelector'
import TaskList from './TaskList'
import Timeline from './Timeline'

interface InitiativeCardProps {
  initiative: Initiative
  onUpdate?: () => void
}

export default function InitiativeCard({ initiative, onUpdate }: InitiativeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [latestUpdate, setLatestUpdate] = useState<Update | null>(null)
  const [allUpdates, setAllUpdates] = useState<(Update & { tasks?: Task[] })[]>([])
  const [openTasks, setOpenTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [confidencePlan, setConfidencePlan] = useState<ConfidenceLevel>('medium')
  const [confidenceAlignment, setConfidenceAlignment] = useState<ConfidenceLevel>('medium')
  const [confidenceExecution, setConfidenceExecution] = useState<ConfidenceLevel>('medium')
  const [confidenceOutcomes, setConfidenceOutcomes] = useState<ConfidenceOutcome>('na')
  const [statusMood, setStatusMood] = useState<StatusMood>('neutral')
  const [latestStatus, setLatestStatus] = useState('')
  const [biggestRiskWorry, setBiggestRiskWorry] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [deptProduct, setDeptProduct] = useState(false)
  const [deptTech, setDeptTech] = useState(false)
  const [deptMarketing, setDeptMarketing] = useState(false)
  const [deptClientSuccess, setDeptClientSuccess] = useState(false)
  const [deptCommercial, setDeptCommercial] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchLatestUpdate()
    if (isExpanded) {
      fetchAllUpdates()
    }
  }, [isExpanded])

  // Pre-populate form with latest update data
  useEffect(() => {
    if (latestUpdate) {
      setConfidencePlan(latestUpdate.confidence_plan || 'medium')
      setConfidenceAlignment(latestUpdate.confidence_alignment || 'medium')
      setConfidenceExecution(latestUpdate.confidence_execution || 'medium')
      setConfidenceOutcomes(latestUpdate.confidence_outcomes || 'na')
      setStatusMood(latestUpdate.status_mood || 'neutral')
      setLatestStatus(latestUpdate.latest_status || '')
      setBiggestRiskWorry(latestUpdate.biggest_risk_worry || '')
      setDeptProduct(latestUpdate.dept_product_aligned || false)
      setDeptTech(latestUpdate.dept_tech_aligned || false)
      setDeptMarketing(latestUpdate.dept_marketing_aligned || false)
      setDeptClientSuccess(latestUpdate.dept_client_success_aligned || false)
      setDeptCommercial(latestUpdate.dept_commercial_aligned || false)

      // Fetch and populate tasks from latest update
      const fetchLatestTasks = async () => {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('update_id', latestUpdate.id)
          .order('display_order')

        if (tasksData) {
          setTasks(tasksData)
        }
      }
      fetchLatestTasks()
    }
  }, [latestUpdate])

  async function fetchLatestUpdate() {
    setLoading(true)
    const { data: updates } = await supabase
      .from('updates')
      .select('*')
      .eq('initiative_id', initiative.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (updates && updates.length > 0) {
      setLatestUpdate(updates[0])

      // Fetch tasks for latest update
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('update_id', updates[0].id)
        .order('display_order')

      if (tasksData) {
        setOpenTasks(tasksData.filter(t => !t.is_completed))
      }
    }
    setLoading(false)
  }

  async function fetchAllUpdates() {
    const { data: updates } = await supabase
      .from('updates')
      .select('*')
      .eq('initiative_id', initiative.id)
      .order('created_at', { ascending: false })

    if (updates) {
      // Fetch tasks for each update
      const updatesWithData = await Promise.all(
        updates.map(async (update) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('update_id', update.id)
            .order('display_order')

          return { ...update, tasks: tasks || [] }
        })
      )

      setAllUpdates(updatesWithData)
    }
  }

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation()
    setSaving(true)

    try {
      // Create new update
      const { data: newUpdate, error: updateError } = await supabase
        .from('updates')
        .insert({
          initiative_id: initiative.id,
          confidence_plan: confidencePlan,
          confidence_alignment: confidenceAlignment,
          confidence_execution: confidenceExecution,
          confidence_outcomes: confidenceOutcomes,
          status_mood: statusMood,
          latest_status: latestStatus,
          biggest_risk_worry: biggestRiskWorry,
          dept_product_aligned: deptProduct,
          dept_tech_aligned: deptTech,
          dept_marketing_aligned: deptMarketing,
          dept_client_success_aligned: deptClientSuccess,
          dept_commercial_aligned: deptCommercial,
        })
        .select()
        .single()

      if (updateError) throw updateError

      // Save tasks
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map((task, index) => ({
          update_id: newUpdate.id,
          task_text: task.task_text,
          is_completed: task.is_completed,
          display_order: index,
          due_date: task.due_date,
        }))

        await supabase.from('tasks').insert(tasksToInsert)
      }

      // Refresh data
      await fetchLatestUpdate()
      await fetchAllUpdates()

      // Reset form to latest values
      resetForm()

      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error saving update:', error)
      alert('Error saving update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setConfidencePlan('medium')
    setConfidenceAlignment('medium')
    setConfidenceExecution('medium')
    setConfidenceOutcomes('na')
    setStatusMood('neutral')
    setLatestStatus('')
    setBiggestRiskWorry('')
    setTasks([])
    setDeptProduct(false)
    setDeptTech(false)
    setDeptMarketing(false)
    setDeptClientSuccess(false)
    setDeptCommercial(false)
  }

  function handleCardClick() {
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)' }}
      onClick={handleCardClick}
    >
      {/* Collapsed View */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{initiative.name}</h2>
            {latestUpdate && (
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Updated {formatDistanceToNow(new Date(latestUpdate.created_at), { addSuffix: true })}
              </p>
            )}
          </div>
          {latestUpdate && (
            <span className="text-3xl">{getMoodEmoji(latestUpdate.status_mood)}</span>
          )}
        </div>

        {latestUpdate && (
          <>
            <div className="mb-4"></div>

            {/* Confidence Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <ConfidenceBadge label="Plan" level={latestUpdate.confidence_plan} compact />
              <ConfidenceBadge label="Alignment" level={latestUpdate.confidence_alignment} compact />
              <ConfidenceBadge label="Execution" level={latestUpdate.confidence_execution} compact />
              <ConfidenceBadge label="Outcomes" level={latestUpdate.confidence_outcomes} compact />
            </div>

            {/* Nearest Task Deadline */}
            {(() => {
              const upcomingTasks = openTasks.filter(t => !t.is_completed && t.due_date)
              if (upcomingTasks.length > 0) {
                const sortedTasks = upcomingTasks.sort((a, b) =>
                  new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
                )
                const nearestTask = sortedTasks[0]
                const daysText = formatWorkingDaysUntil(nearestTask.due_date)

                return (
                  <div className="mb-4 text-sm font-medium text-gray-700">
                    📅 Next deadline: <span className="text-pink-600">{daysText}</span>
                  </div>
                )
              }
              return null
            })()}

            {/* Latest Status */}
            {latestUpdate.latest_status && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className={`text-base font-semibold ${getMoodColor(latestUpdate.status_mood)}`}>
                  {latestUpdate.latest_status}
                </div>
              </div>
            )}

            {/* Open Tasks */}
            {openTasks.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Open Tasks/Milestones</h4>
                <TaskList tasks={openTasks} onTasksChange={() => {}} editable={false} />
              </div>
            )}
          </>
        )}

        {!latestUpdate && !loading && (
          <p className="text-sm text-gray-400">No updates yet. Click to add one.</p>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50" onClick={(e) => e.stopPropagation()}>
          {/* Confidence Selectors */}
          <div className="p-6 bg-white border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confidence Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Plan Creation
                </label>
                <select
                  value={confidencePlan}
                  onChange={(e) => setConfidencePlan(e.target.value as ConfidenceLevel)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base font-medium"
                >
                  <option value="poor">Poor</option>
                  <option value="medium">Medium</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Alignment to Plan
                </label>
                <select
                  value={confidenceAlignment}
                  onChange={(e) => setConfidenceAlignment(e.target.value as ConfidenceLevel)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base font-medium"
                >
                  <option value="poor">Poor</option>
                  <option value="medium">Medium</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Execution of Plan
                </label>
                <select
                  value={confidenceExecution}
                  onChange={(e) => setConfidenceExecution(e.target.value as ConfidenceLevel)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base font-medium"
                >
                  <option value="poor">Poor</option>
                  <option value="medium">Medium</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Outcomes
                </label>
                <select
                  value={confidenceOutcomes}
                  onChange={(e) => setConfidenceOutcomes(e.target.value as ConfidenceOutcome)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base font-medium"
                >
                  <option value="poor">Poor</option>
                  <option value="medium">Medium</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                  <option value="na">N/A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Current State */}
          <div className="p-6 bg-white border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Current State</h3>

            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-900 mb-3">Status Mood</label>
              <EmojiSelector value={statusMood} onChange={setStatusMood} />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-900 mb-2">Latest Status</label>
              <textarea
                value={latestStatus}
                onChange={(e) => setLatestStatus(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="What's the latest update?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base"
                rows={3}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Tasks/Milestones
              </label>
              <TaskList tasks={tasks} onTasksChange={setTasks} editable={true} />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Biggest Risk/Worry
              </label>
              <textarea
                value={biggestRiskWorry}
                onChange={(e) => setBiggestRiskWorry(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="What's the biggest risk or worry right now?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base"
                rows={2}
              />
            </div>
          </div>

          {/* Department Alignment */}
          <div className="p-6 bg-white border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Department Alignment Status</h3>
            <p className="text-sm text-gray-600 mb-4">Are they aligned to recent developments?</p>
            <div className="space-y-2">
              {[
                { label: 'Product', value: deptProduct, setter: setDeptProduct },
                { label: 'Tech/Engineering', value: deptTech, setter: setDeptTech },
                { label: 'Marketing', value: deptMarketing, setter: setDeptMarketing },
                { label: 'Client Success', value: deptClientSuccess, setter: setDeptClientSuccess },
                { label: 'Commercial', value: deptCommercial, setter: setDeptCommercial },
              ].map((dept) => (
                <label key={dept.label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dept.value}
                    onChange={(e) => {
                      e.stopPropagation()
                      dept.setter(e.target.checked)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{dept.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="p-6 bg-white">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full text-white py-4 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all duration-200 text-lg"
              style={{
                background: saving ? '#DDDDDD' : 'linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)',
                boxShadow: saving ? 'none' : '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)'
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Timeline */}
          {allUpdates.length > 0 && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Update Timeline</h3>
              <Timeline updates={allUpdates} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
