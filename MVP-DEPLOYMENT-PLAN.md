# Strategic Initiative Tracker - MVP Deployment Plan

⚠️ **IMPORTANT: UPDATE CHANGELOG BELOW WHENEVER MAKING CHANGES** ⚠️

## CHANGELOG

### Version 1.0 (2026-01-05)
- Initial deployment plan created
- Includes Supabase setup, database schema, RLS policies
- Git repository configuration
- Vercel deployment steps
- Testing checklist
- Launch validation checklist

---

## Overview

This document provides a step-by-step plan to deploy the Strategic Initiative Tracker MVP to production using:
- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Version Control**: Git/GitHub

**Estimated Total Time**: 6-8 hours (including testing)

---

## Phase 1: Repository Setup (30 minutes)

### 1.1 Create Git Repository

```bash
cd /Users/juliandunn/Desktop/OperationalCoPilot
git init
```

### 1.2 Create .gitignore

```bash
# .gitignore
node_modules/
.next/
out/
build/
.env*.local
.DS_Store
*.log
.vercel
```

### 1.3 Initial Commit

```bash
git add .
git commit -m "Initial commit: Wireframe and documentation"
```

### 1.4 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `strategic-initiative-tracker`
3. Description: "Personal tool for tracking strategic initiatives"
4. Visibility: Private (recommended)
5. Do NOT initialize with README (we already have files)
6. Click "Create repository"

### 1.5 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/strategic-initiative-tracker.git
git branch -M main
git push -u origin main
```

**✅ Checkpoint**: Repository is created and code is pushed to GitHub

---

## Phase 2: Supabase Project Setup (1 hour)

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in details:
   - **Name**: strategic-initiative-tracker
   - **Database Password**: Generate strong password (save in password manager)
   - **Region**: Choose closest region to you
   - **Pricing Plan**: Free tier (sufficient for MVP)
4. Click "Create new project"
5. Wait 2-3 minutes for project provisioning

**✅ Checkpoint**: Supabase project is created and ready

### 2.2 Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Configure Email provider:
   - Enable "Email" provider
   - **Confirm email**: Toggle OFF (for easier testing in MVP)
   - **Secure email change**: ON
   - **Secure password change**: ON
3. Go to **Authentication** → **URL Configuration**
   - **Site URL**: Will update later with Vercel URL
   - Leave redirect URLs empty for now
4. Go to **Authentication** → **Email Templates**
   - Review default templates (can customize later)

**✅ Checkpoint**: Authentication is configured

### 2.3 Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the following SQL (execute each section separately):

**Section 1: Create initiatives table**
```sql
CREATE TABLE initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own initiatives"
  ON initiatives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own initiatives"
  ON initiatives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own initiatives"
  ON initiatives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own initiatives"
  ON initiatives FOR DELETE
  USING (auth.uid() = user_id);
```

**Section 2: Create updates table**
```sql
CREATE TABLE updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  confidence_plan TEXT CHECK (confidence_plan IN ('poor', 'medium', 'good', 'excellent')),
  confidence_alignment TEXT CHECK (confidence_alignment IN ('poor', 'medium', 'good', 'excellent')),
  confidence_execution TEXT CHECK (confidence_execution IN ('poor', 'medium', 'good', 'excellent')),
  confidence_outcomes TEXT CHECK (confidence_outcomes IN ('poor', 'medium', 'good', 'excellent', 'na')),
  status_mood TEXT CHECK (status_mood IN ('great', 'good', 'neutral', 'concerned', 'warning')),
  latest_status TEXT,
  biggest_risk_worry TEXT,
  dept_product_aligned BOOLEAN,
  dept_tech_aligned BOOLEAN,
  dept_marketing_aligned BOOLEAN,
  dept_client_success_aligned BOOLEAN,
  dept_commercial_aligned BOOLEAN
);

-- Enable Row Level Security
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own updates"
  ON updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM initiatives
      WHERE initiatives.id = updates.initiative_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own updates"
  ON updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM initiatives
      WHERE initiatives.id = updates.initiative_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own updates"
  ON updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM initiatives
      WHERE initiatives.id = updates.initiative_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own updates"
  ON updates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM initiatives
      WHERE initiatives.id = updates.initiative_id
      AND initiatives.user_id = auth.uid()
    )
  );
```

**Section 3: Create tasks table**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM updates
      JOIN initiatives ON initiatives.id = updates.initiative_id
      WHERE updates.id = tasks.update_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM updates
      JOIN initiatives ON initiatives.id = updates.initiative_id
      WHERE updates.id = tasks.update_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM updates
      JOIN initiatives ON initiatives.id = updates.initiative_id
      WHERE updates.id = tasks.update_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM updates
      JOIN initiatives ON initiatives.id = updates.initiative_id
      WHERE updates.id = tasks.update_id
      AND initiatives.user_id = auth.uid()
    )
  );
```

**Section 4: Create milestones table**
```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
  milestone_text TEXT NOT NULL,
  target_date DATE,
  display_order INTEGER NOT NULL
);

-- Enable Row Level Security
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own milestones"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM updates
      JOIN initiatives ON initiatives.id = updates.initiative_id
      WHERE updates.id = milestones.update_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own milestones"
  ON milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM updates
      JOIN initiatives ON initiatives.id = updates.initiative_id
      WHERE updates.id = milestones.update_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own milestones"
  ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM updates
      JOIN initiatives ON initiatives.id = updates.initiative_id
      WHERE updates.id = milestones.update_id
      AND initiatives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own milestones"
  ON milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM updates
      JOIN initiatives ON initiatives.id = updates.initiative_id
      WHERE updates.id = milestones.update_id
      AND initiatives.user_id = auth.uid()
    )
  );
```

**Section 5: Create initialization function**
```sql
CREATE OR REPLACE FUNCTION initialize_user_initiatives()
RETURNS void AS $$
BEGIN
  -- Check if user already has initiatives
  IF NOT EXISTS (SELECT 1 FROM initiatives WHERE user_id = auth.uid()) THEN
    INSERT INTO initiatives (name, user_id) VALUES
      ('Shop', auth.uid()),
      ('Open Banking', auth.uid()),
      ('Engage Layer', auth.uid()),
      ('ACE', auth.uid()),
      ('Engage to Activate', auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

4. Click "Run" for each section
5. Verify each section executes successfully (no errors)

**✅ Checkpoint**: Database schema is created with all tables and RLS policies

### 2.4 Verify Database Setup

1. Go to **Table Editor** in Supabase dashboard
2. Confirm you see 4 tables: `initiatives`, `updates`, `tasks`, `milestones`
3. Click on each table and verify columns match the schema
4. Go to **Authentication** → **Policies**
5. Verify RLS policies are shown for each table

**✅ Checkpoint**: Database structure verified

### 2.5 Copy Connection Details

1. Go to **Settings** → **API**
2. Copy and save the following:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Keep these handy for Next.js environment variables

**✅ Checkpoint**: Supabase configuration complete

---

## Phase 3: Next.js Application Setup (2-3 hours)

### 3.1 Create Next.js Project

```bash
cd /Users/juliandunn/Desktop/OperationalCoPilot
npx create-next-app@latest initiative-tracker --typescript --tailwind --app --eslint
cd initiative-tracker
```

When prompted:
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ `src/` directory: No
- ✅ App Router: Yes
- ✅ Import alias: Yes (default @/*)

### 3.2 Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install date-fns  # For date formatting
```

### 3.3 Create Environment Variables

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual Supabase URL and anon key from step 2.5.

### 3.4 Project Structure

Create the following folder structure:

```
initiative-tracker/
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── InitiativeCard.tsx
│   ├── UpdateForm.tsx
│   └── Timeline.tsx
├── lib/
│   ├── supabase.ts
│   └── types.ts
├── public/
└── .env.local
```

### 3.5 Core File Implementation

**File: `lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**File: `lib/types.ts`**
```typescript
export type ConfidenceLevel = 'poor' | 'medium' | 'good' | 'excellent'
export type ConfidenceOutcome = ConfidenceLevel | 'na'
export type StatusMood = 'great' | 'good' | 'neutral' | 'concerned' | 'warning'

export interface Initiative {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Update {
  id: string
  initiative_id: string
  created_at: string
  confidence_plan: ConfidenceLevel
  confidence_alignment: ConfidenceLevel
  confidence_execution: ConfidenceLevel
  confidence_outcomes: ConfidenceOutcome
  status_mood: StatusMood
  latest_status: string
  biggest_risk_worry: string
  dept_product_aligned: boolean
  dept_tech_aligned: boolean
  dept_marketing_aligned: boolean
  dept_client_success_aligned: boolean
  dept_commercial_aligned: boolean
}

export interface Task {
  id: string
  update_id: string
  task_text: string
  is_completed: boolean
  display_order: number
}

export interface Milestone {
  id: string
  update_id: string
  milestone_text: string
  target_date: string | null
  display_order: number
}
```

**File: `app/login/page.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Strategic Initiative Tracker</h1>
        <h2 className="text-xl font-semibold mb-4">Sign In</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href="/signup" className="text-blue-600 hover:underline">
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**File: `app/signup/page.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Initialize user's initiatives
      const { error: initError } = await supabase.rpc('initialize_user_initiatives')

      if (initError) {
        console.error('Error initializing initiatives:', initError)
      }

      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Strategic Initiative Tracker</h1>
        <h2 className="text-xl font-semibold mb-4">Create Account</h2>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**File: `app/page.tsx`** (Landing/redirect)
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>
  )
}
```

**File: `app/dashboard/page.tsx`** (Placeholder - will implement in Phase 4)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    })
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return <div>Loading...</div>
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
        <p className="text-gray-600">Welcome, {user.email}</p>
        <p className="text-gray-500 mt-4">Dashboard implementation coming in Phase 4...</p>
      </div>
    </div>
  )
}
```

### 3.6 Test Locally

```bash
npm run dev
```

Open http://localhost:3000 and test:
- ✅ Redirects to /login
- ✅ Can create account at /signup
- ✅ Can login with created account
- ✅ Redirects to /dashboard after login
- ✅ Can logout and returns to /login

**✅ Checkpoint**: Authentication flow works locally

---

## Phase 4: Build Dashboard Components (2-3 hours)

This phase involves implementing the full dashboard with initiative cards, inline editing, timeline, etc. based on the wireframe.

**Key components to build:**
1. `InitiativeCard.tsx` - Individual initiative card with expand/collapse
2. `UpdateForm.tsx` - Inline editing form for all fields
3. `Timeline.tsx` - Historical updates display with pagination
4. `ConfidenceBadge.tsx` - Color-coded confidence indicators
5. `TaskList.tsx` - Dynamic task list with add/remove/complete
6. `MilestoneList.tsx` - Dynamic milestone list with add/remove

**Implementation Note**: This phase requires converting the wireframe HTML to React components. Detailed implementation can be done after validating the deployment infrastructure works.

**✅ Checkpoint**: Dashboard displays initiatives and allows updates

---

## Phase 5: Vercel Deployment (30 minutes)

### 5.1 Prepare for Deployment

```bash
# Test production build locally
npm run build
npm run start
```

Verify build completes without errors.

### 5.2 Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `initiative-tracker` (if not at repo root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Add Environment Variables:
   - Click "Environment Variables"
   - Add `NEXT_PUBLIC_SUPABASE_URL` with your Supabase URL
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your anon key
6. Click "Deploy"
7. Wait 2-3 minutes for deployment

**✅ Checkpoint**: Application is deployed to Vercel

### 5.3 Update Supabase Authentication URLs

1. Copy your Vercel deployment URL (e.g., `https://strategic-initiative-tracker.vercel.app`)
2. Go to Supabase dashboard → **Authentication** → **URL Configuration**
3. Update **Site URL** to your Vercel URL
4. Add to **Redirect URLs**:
   - `https://strategic-initiative-tracker.vercel.app/dashboard`
   - `https://strategic-initiative-tracker.vercel.app/login`

**✅ Checkpoint**: Authentication works on production URL

---

## Phase 6: Testing & Validation (1 hour)

### 6.1 Functional Testing Checklist

Test on production URL:

**Authentication:**
- [ ] Sign up with new email creates account
- [ ] Login with correct credentials works
- [ ] Login with incorrect credentials shows error
- [ ] Logout works and redirects to login
- [ ] Cannot access /dashboard without authentication
- [ ] Session persists across browser refresh

**Database:**
- [ ] New user gets 5 default initiatives on signup
- [ ] Initiatives display on dashboard
- [ ] Can create new update for an initiative
- [ ] Update saves to database
- [ ] Can view update in timeline
- [ ] Tasks save and display correctly
- [ ] Milestones save and display correctly
- [ ] Confidence levels save and display correctly
- [ ] Department alignment checkboxes save correctly

**UI/UX:**
- [ ] Mobile responsive (test on phone or DevTools)
- [ ] Cards expand/collapse correctly
- [ ] Inline editing works without modal
- [ ] "Save Changes" button works
- [ ] Timeline pagination works (show 3, load more)
- [ ] Task checkboxes toggle strikethrough
- [ ] Add/remove tasks works
- [ ] Add/remove milestones works
- [ ] Emoji selector works
- [ ] Confidence badges display with correct colors

### 6.2 Security Testing

- [ ] RLS policies work (user A cannot see user B's data)
- [ ] Direct API calls are blocked without authentication
- [ ] SQL injection attempts fail
- [ ] XSS attempts are sanitized

### 6.3 Performance Testing

- [ ] Page loads in < 3 seconds
- [ ] Database queries are efficient (check Supabase dashboard)
- [ ] No console errors in browser
- [ ] Build size is reasonable (< 500KB initial JS)

**✅ Checkpoint**: All tests pass

---

## Phase 7: Launch Checklist

### Pre-Launch
- [ ] All documentation updated with changelog
- [ ] .env.local is NOT committed to Git
- [ ] Production environment variables set in Vercel
- [ ] Database schema matches technical specification
- [ ] RLS policies are active on all tables
- [ ] Authentication email templates reviewed
- [ ] Error boundaries implemented for graceful failures

### Launch
- [ ] Create first production user account
- [ ] Verify 5 initiatives are created
- [ ] Create test update with tasks and milestones
- [ ] Share URL with yourself for testing
- [ ] Bookmark production URL

### Post-Launch Monitoring
- [ ] Check Vercel analytics for errors
- [ ] Check Supabase logs for database issues
- [ ] Monitor authentication success/failure rates
- [ ] Note any performance issues

**✅ Checkpoint**: Application is live and functional

---

## Troubleshooting Guide

### Issue: Build fails on Vercel
**Solution**:
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Test `npm run build` locally first
- Check for TypeScript errors

### Issue: Authentication not working
**Solution**:
- Verify environment variables are set in Vercel
- Check Site URL in Supabase matches Vercel URL
- Check browser console for CORS errors
- Verify Supabase anon key is correct

### Issue: Database queries fail
**Solution**:
- Check RLS policies are enabled
- Verify user is authenticated (`auth.uid()` returns value)
- Check Supabase logs for policy violations
- Test queries in SQL Editor as authenticated user

### Issue: Users can't see their initiatives
**Solution**:
- Verify `initialize_user_initiatives()` function ran on signup
- Check initiatives table has `user_id` matching authenticated user
- Check RLS policies on initiatives table
- Manually insert initiatives via SQL if needed

---

## Maintenance & Updates

### Making Code Changes

```bash
# Make changes locally
git add .
git commit -m "Description of changes"
git push origin main

# Vercel auto-deploys on push to main
```

### Database Schema Changes

1. Test schema changes in Supabase SQL Editor
2. Document changes in technical-specification.md changelog
3. Apply to production database
4. Update TypeScript types if needed
5. Test thoroughly before pushing code changes

### Backup Strategy

- Supabase automatically backs up database daily
- Export important data periodically via SQL
- Keep Git history clean with meaningful commits

---

## Success Criteria

The MVP deployment is successful when:

1. ✅ User can sign up and login securely
2. ✅ User sees 5 initiatives on dashboard
3. ✅ User can create updates with all fields (confidence, status, tasks, milestones, alignment)
4. ✅ Updates save to database and appear in timeline
5. ✅ Timeline shows 3 most recent, with "Load More" working
6. ✅ Task completion toggles strikethrough
7. ✅ Inline editing works without modal
8. ✅ Application is mobile responsive
9. ✅ Data is isolated per user via RLS
10. ✅ Application is deployed and accessible via HTTPS

---

## Next Steps (Post-MVP)

After successful MVP deployment:

1. Gather user feedback (use for 1-2 weeks)
2. Identify pain points and bugs
3. Prioritize V2 features:
   - Edit/delete updates
   - Export timeline to PDF
   - Email reminders for stale initiatives
   - AI analysis integration
4. Document all bugs and feature requests
5. Update changelog for any hotfixes

---

## Appendix: Quick Reference Commands

```bash
# Local development
npm run dev

# Build for production
npm run build
npm run start

# Deploy (auto via Git push)
git add .
git commit -m "message"
git push origin main

# Database backup (run in Supabase SQL Editor)
COPY (SELECT * FROM initiatives) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM updates) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM tasks) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM milestones) TO STDOUT WITH CSV HEADER;
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-05
**Status**: Ready for implementation
