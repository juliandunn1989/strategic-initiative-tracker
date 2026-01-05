import { Task } from '@/lib/types'
import { useState } from 'react'

interface TaskListProps {
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
  editable?: boolean
}

export default function TaskList({ tasks, onTasksChange, editable = false }: TaskListProps) {
  const handleToggleComplete = (index: number) => {
    const newTasks = [...tasks]
    newTasks[index].is_completed = !newTasks[index].is_completed
    onTasksChange(newTasks)
  }

  const handleTaskTextChange = (index: number, text: string) => {
    const newTasks = [...tasks]
    newTasks[index].task_text = text
    onTasksChange(newTasks)
  }

  const handleAddTask = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      update_id: '',
      task_text: '',
      is_completed: false,
      display_order: tasks.length,
      due_date: null,
    }
    onTasksChange([...tasks, newTask])
  }

  const handleDateChange = (index: number, date: string) => {
    const newTasks = [...tasks]
    newTasks[index].due_date = date || null
    onTasksChange(newTasks)
  }

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index)
    onTasksChange(newTasks)
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div key={task.id || index} className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={(e) => {
              e.stopPropagation()
              handleToggleComplete(index)
            }}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer flex-shrink-0"
            disabled={!editable}
          />
          {editable ? (
            <>
              <input
                type="text"
                value={task.task_text}
                onChange={(e) => {
                  e.stopPropagation()
                  handleTaskTextChange(index, e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter task..."
                disabled={task.is_completed}
                className={`flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                  task.is_completed ? 'line-through text-gray-400 bg-gray-50' : ''
                }`}
              />
              <input
                type="date"
                value={task.due_date || ''}
                onChange={(e) => {
                  e.stopPropagation()
                  handleDateChange(index, e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={task.is_completed}
                className="w-36 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs flex-shrink-0"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveTask(index)
                }}
                className="text-red-500 hover:text-red-700 text-lg flex-shrink-0"
              >
                ✕
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-between">
              <span
                className={`text-sm ${
                  task.is_completed ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
              >
                {task.task_text}
              </span>
              {task.due_date && (
                <span className="text-xs text-gray-500 font-medium ml-2 flex-shrink-0">
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
            handleAddTask()
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add Task
        </button>
      )}
    </div>
  )
}
