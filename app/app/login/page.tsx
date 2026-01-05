'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-10 border border-gray-200" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)' }}>
        <h1 className="text-2xl font-semibold text-center mb-2 text-gray-900">Welcome back</h1>
        <p className="text-sm text-center text-gray-600 mb-8">Strategic Initiative Tracker</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-700 text-sm bg-red-50 p-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3.5 px-6 rounded-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200"
            style={{
              background: loading ? '#DDDDDD' : 'linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)',
              boxShadow: loading ? 'none' : '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <Link href="/signup" className="font-semibold" style={{ color: '#E31C5F' }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
