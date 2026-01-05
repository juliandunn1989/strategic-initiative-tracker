'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Initiative } from '@/lib/types'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
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
    const { data, error } = await supabase
      .from('initiatives')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching initiatives:', error)
    } else {
      setInitiatives(data || [])
    }
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Strategic Initiatives</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Logout
          </button>
        </div>

        <p className="text-gray-600 mb-6">Welcome, {user?.email}</p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initiatives.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">No initiatives found</p>
              <p className="text-sm text-gray-400">Your 5 default initiatives should appear here</p>
            </div>
          ) : (
            initiatives.map((initiative) => (
              <div
                key={initiative.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2">{initiative.name}</h2>
                <p className="text-sm text-gray-500">
                  Created: {new Date(initiative.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
