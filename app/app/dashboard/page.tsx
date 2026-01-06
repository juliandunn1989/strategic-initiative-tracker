'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Initiative, Task, Update } from '@/lib/types'
import InitiativeCard from '@/components/InitiativeCard'
import OtherProjectsCard from '@/components/OtherProjectsCard'

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

    // Separate "Other Projects" from regular initiatives
    const otherProjectsInitiative = initiativesWithDeadlines.find(i => i.name === 'Other Projects')
    const regularInitiatives = initiativesWithDeadlines.filter(i => i.name !== 'Other Projects')

    // Sort regular initiatives by deadline, then alphabetically
    regularInitiatives.sort((a, b) => {
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

    // Put "Other Projects" at the end if it exists
    const sortedInitiatives = otherProjectsInitiative
      ? [...regularInitiatives, otherProjectsInitiative]
      : regularInitiatives

    setInitiatives(sortedInitiatives)
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
        <div className="flex justify-between items-start mb-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              High-level initiative tracker
            </h1>
            <p className="text-base text-gray-600 font-medium">Welcome back, {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-all duration-200 flex-shrink-0"
          >
            Logout
          </button>
        </div>

        {/* Confidence Legend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Critical Statuses</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-1.5 bg-blue-500 rounded-full"></div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Plan</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Do we have a strong plan for the initiative across all departments? With particular focus on GTM</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-1.5 bg-purple-500 rounded-full"></div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Alignment</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Is the business fully aligned to that plan? Is it clearly understood and backed by all?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-1.5 bg-indigo-500 rounded-full"></div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Execution</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Are we executing effectively and in sync across all departments against the plan?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-1.5 bg-teal-500 rounded-full"></div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Outcomes</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Is the execution delivering business outcomes in alignment with budget targets and KPIs?</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initiatives.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">No initiatives found</p>
              <p className="text-sm text-gray-400">Your default initiatives should appear here</p>
            </div>
          ) : (
            initiatives.map((initiative) => (
              initiative.name === 'Other Projects' ? (
                <OtherProjectsCard
                  key={initiative.id}
                  initiative={initiative}
                />
              ) : (
                <InitiativeCard
                  key={initiative.id}
                  initiative={initiative}
                  onUpdate={fetchInitiatives}
                />
              )
            ))
          )}
        </div>
      </div>
    </div>
  )
}
