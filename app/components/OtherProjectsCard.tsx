'use client'

import { useState, useEffect } from 'react'
import { Initiative, Task } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import TaskList from './TaskList'

interface OtherProjectsCardProps {
  initiative: Initiative
}

export default function OtherProjectsCard({ initiative }: OtherProjectsCardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [updateId, setUpdateId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchOrCreateUpdate()
  }, [])

  async function fetchOrCreateUpdate() {
    // Get or create the single update for "Other projects"
    const { data: existingUpdate } = await supabase
      .from('updates')
      .select('id')
      .eq('initiative_id', initiative.id)
      .limit(1)
      .single()

    if (existingUpdate) {
      setUpdateId(existingUpdate.id)
      await fetchTasks(existingUpdate.id)
    } else {
      // Create a placeholder update
      const { data: newUpdate, error } = await supabase
        .from('updates')
        .insert({
          initiative_id: initiative.id,
          confidence_plan: 'na',
          confidence_alignment: 'na',
          confidence_execution: 'na',
          confidence_outcomes: 'na',
          status_mood: 'neutral',
          latest_status: 'Miscellaneous projects tracking',
          biggest_risk_worry: null,
          dept_product_aligned: false,
          dept_tech_aligned: false,
          dept_marketing_aligned: false,
          dept_client_success_aligned: false,
          dept_commercial_aligned: false,
        })
        .select()
        .single()

      if (!error && newUpdate) {
        setUpdateId(newUpdate.id)
      }
    }
  }

  async function fetchTasks(updateId: string) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('update_id', updateId)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (data) {
      setTasks(data)
    }
  }

  async function handleSave() {
    if (!updateId) return

    setSaving(true)
    try {
      // Delete existing tasks
      await supabase.from('tasks').delete().eq('update_id', updateId)

      // Insert updated tasks (filter out empty tasks)
      const validTasks = tasks.filter(task => task.task_text.trim() !== '')
      if (validTasks.length > 0) {
        const tasksToInsert = validTasks.map((task, index) => ({
          update_id: updateId,
          task_text: task.task_text,
          is_completed: task.is_completed,
          display_order: index,
          due_date: task.due_date || null,
        }))

        const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert)
        if (tasksError) throw tasksError
      }

      // Refresh tasks
      await fetchTasks(updateId)
    } catch (error) {
      console.error('Error saving tasks:', error)
      alert('Error saving tasks. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Projects</h2>

        {/* Tasks */}
        <div className="mb-6">
          <TaskList tasks={tasks} onTasksChange={setTasks} editable={true} />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full text-white py-2.5 px-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 text-sm"
          style={{
            background: saving ? '#DDDDDD' : 'linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)',
            boxShadow: saving ? 'none' : '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)'
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
