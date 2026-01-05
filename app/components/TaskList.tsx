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
    }
    onTasksChange([...tasks, newTask])
  }

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index)
    onTasksChange(newTasks)
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div key={task.id || index} className="flex gap-2 items-start">
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={(e) => {
              e.stopPropagation()
              handleToggleComplete(index)
            }}
            className="mt-1.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
            disabled={!editable}
          />
          {editable ? (
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
          ) : (
            <span
              className={`flex-1 text-sm ${
                task.is_completed ? 'line-through text-gray-400' : 'text-gray-700'
              }`}
            >
              {task.task_text}
            </span>
          )}
          {editable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveTask(index)
              }}
              className="text-red-500 hover:text-red-700 text-lg"
            >
              ✕
            </button>
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
