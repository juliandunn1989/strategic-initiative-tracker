'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Initiative, Task, Update } from '@/lib/types'
import InitiativeCard from '@/components/InitiativeCard'

interface InitiativeWithDeadline extends Initiative {
  nearestDeadline: string | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [initiatives, setInitiatives] = useState<InitiativeWithDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUser(session.user)
    await fetchInitiatives()
    setLoading(false)
  }

  async function fetchInitiatives() {
    const { data: initiativesData, error } = await supabase
      .from('initiatives')
      .select('*')

    if (error) {
      console.error('Error fetching initiatives:', error)
      return
    }

    if (!initiativesData) {
      setInitiatives([])
      return
    }

    // Fetch latest update and tasks for each initiative
    const initiativesWithDeadlines = await Promise.all(
      initiativesData.map(async (initiative) => {
        // Get latest update
        const { data: latestUpdate } = await supabase
          .from('updates')
          .select('id')
          .eq('initiative_id', initiative.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!latestUpdate) {
          return { ...initiative, nearestDeadline: null }
        }

        // Get upcoming tasks with due dates
        const { data: tasks } = await supabase
          .from('tasks')
          .select('due_date, is_completed')
          .eq('update_id', latestUpdate.id)
          .eq('is_completed', false)
          .not('due_date', 'is', null)
          .order('due_date', { ascending: true })

        // Find nearest upcoming deadline
        const nearestDeadline = tasks && tasks.length > 0 ? tasks[0].due_date : null

        return { ...initiative, nearestDeadline }
      })
    )

    // Sort initiatives by deadline, then alphabetically
    initiativesWithDeadlines.sort((a, b) => {
      // If both have deadlines, sort by date
      if (a.nearestDeadline && b.nearestDeadline) {
        const dateCompare = new Date(a.nearestDeadline).getTime() - new Date(b.nearestDeadline).getTime()
        // If dates are the same, sort alphabetically
        if (dateCompare === 0) {
          return a.name.localeCompare(b.name)
        }
        return dateCompare
      }
      // If only a has deadline, it comes first
      if (a.nearestDeadline) return -1
      // If only b has deadline, it comes first
      if (b.nearestDeadline) return 1
      // Neither has deadline, sort alphabetically
      return a.name.localeCompare(b.name)
    })

    setInitiatives(initiativesWithDeadlines)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">Strategic Initiatives</h1>
            <p className="text-base text-gray-600">Welcome back, {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-all duration-200"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initiatives.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">No initiatives found</p>
              <p className="text-sm text-gray-400">Your 5 default initiatives should appear here</p>
            </div>
          ) : (
            initiatives.map((initiative) => (
              <InitiativeCard
                key={initiative.id}
                initiative={initiative}
                onUpdate={fetchInitiatives}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
