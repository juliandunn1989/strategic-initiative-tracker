# Strategic Initiative Tracker - Technical Specification

⚠️ **IMPORTANT: UPDATE CHANGELOG BELOW WHENEVER MAKING CHANGES** ⚠️

## CHANGELOG

### Version 1.3 (2026-01-05)
- **UI Refinements**: Reduced button sizes for desktop, removed helper text
- **Dual Save System**: Added "Save New Update" and "Edit Current" buttons for better update management
- **Task Due Dates**: Added date picker with working days countdown (excluding weekends)
- **Working Days Display**: Summary shows "in X working days" for nearest upcoming task deadline
- **Label Updates**: Changed "Performance vs Outcomes" to "Outcomes"
- **Button Styling**: Reduced padding (py-2.5 px-4) and text size (text-sm) for desktop

### Version 1.2 (2026-01-05)
- **Milestones Removed**: Deleted milestones table and concept, tasks renamed to "Tasks/Milestones"
- **Airbnb Design System**: Applied Airbnb-inspired styling throughout app
  - Pink gradient primary buttons (#E61E4D → #E31C5F → #D70466)
  - System fonts (-apple-system, BlinkMacSystemFont, etc.)
  - Vibrant confidence badges with solid colors
  - Soft shadows and rounded corners
  - Hover scale effects on interactive elements
- **Visual Hierarchy Improvements**:
  - Larger initiative titles (text-2xl font-bold)
  - Larger emojis (text-3xl in summary, text-4xl in selector)
  - Sectioned expanded view with alternating white/gray backgrounds
  - Bold section headers (text-lg font-bold)
  - Larger form fields with thicker borders (border-2, text-base)
  - Prominent save buttons with stronger shadows
- **Form Pre-population**: Form automatically loads previous update data for easy editing
- **Spacing Improvements**: Reduced space between initiative heading and timestamp

### Version 1.1 (2026-01-05)
- **Dual Save Buttons**: "Save New Update" creates new entry, "Edit Current" updates existing update
- **Edit Functionality**: Users can fix typos without creating new timeline entries
- **Helper Text**: Contextual guidance for button usage (later removed in v1.3)

### Version 1.0 (2026-01-05)
- Initial technical specification created
- Tech stack: Next.js 14+, React, TypeScript, Tailwind CSS, Supabase, Vercel
- Database schema: initiatives, updates, tasks tables (milestones removed in v1.2)
- Inline editing model (no modal dialog)
- Timeline pagination (show 3, load more)
- Field rename: "Biggest Blocker" → "Biggest Risk/Worry"
- **Authentication added**: Supabase Auth with email/password
- **Row Level Security (RLS)**: User data isolation policies implemented
- **user_id** field added to initiatives table for multi-user support

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router with Turbopack)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Airbnb design system
- **State Management**: React hooks (useState, useEffect)
- **Date Utilities**: date-fns for date formatting and distance calculations

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase REST API
- **Authentication**: Supabase Auth with email/password

### Hosting & Deployment
- **Platform**: Vercel
- **Environment**: Production at https://strategic-initiative-tracker.vercel.app
- **Auto-deploy**: On push to main branch (GitHub)

### Design System
- **Primary Colors**:
  - Airbnb Pink: #FF385C → #E31C5F (gradient)
  - Text Primary: #222222
  - Text Secondary: #717171
  - Border: #DDDDDD
- **Typography**: System fonts stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif)
- **Shadows**: Soft layered shadows (0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05))
- **Interactions**: Scale effects (hover:scale-[1.02], active:scale-[0.98])

### Responsive Design Breakpoints
- **Mobile**: < 768px (stacked cards, 1 column)
- **Desktop**: ≥ 768px (responsive grid, 2-3 columns)
- **Minimum width**: 320px
- **Maximum tested width**: 1920px

## Database Schema

### Table: `initiatives`
```sql
CREATE TABLE initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own initiatives
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

**Fields:**
- `id`: UUID, primary key
- `user_id`: UUID, foreign key → auth.users(id), not null (cascade delete)
- `name`: Text, not null
- `created_at`: Timestamp

### Table: `updates`
```sql
CREATE TABLE updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id),
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

-- RLS Policy: Users can only see updates for their own initiatives
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

**Fields:**
- `id`: UUID, primary key
- `initiative_id`: UUID, foreign key → initiatives.id
- `created_at`: Timestamp, not null
- `confidence_plan`: Text enum ('poor' | 'medium' | 'good' | 'excellent')
- `confidence_alignment`: Text enum ('poor' | 'medium' | 'good' | 'excellent')
- `confidence_execution`: Text enum ('poor' | 'medium' | 'good' | 'excellent')
- `confidence_outcomes`: Text enum ('poor' | 'medium' | 'good' | 'excellent' | 'na')
- `status_mood`: Text enum ('great' | 'good' | 'neutral' | 'concerned' | 'warning')
- `latest_status`: Text (status update text)
- `biggest_risk_worry`: Text (renamed from biggest_blocker)
- `dept_product_aligned`: Boolean
- `dept_tech_aligned`: Boolean
- `dept_marketing_aligned`: Boolean
- `dept_client_success_aligned`: Boolean
- `dept_commercial_aligned`: Boolean

### Table: `tasks`
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL,
  due_date DATE
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Add index for faster due date queries
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- RLS Policy: Users can only see tasks for their own initiatives
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

**Fields:**
- `id`: UUID, primary key
- `update_id`: UUID, foreign key → updates.id (cascade delete)
- `task_text`: Text, not null
- `is_completed`: Boolean, default false
- `display_order`: Integer (for maintaining task order)
- `due_date`: Date, nullable (added in v1.2)

### Data Relationships
- **One-to-Many**: One initiative has many updates
- **One-to-Many**: One update has many tasks
- **Many-to-One**: Updates always belong to one initiative
- **Many-to-One**: Tasks always belong to one update
- **Current State Logic**: Most recent update determines initiative's "current state"
- **Cascade Delete**: When an update is deleted, all associated tasks are deleted
- **Note**: Milestones table removed in v1.2 - tasks now serve dual purpose as "Tasks/Milestones"

### Mood Emoji Mapping

| Mood | Emoji | Text Color | Use Case |
|------|-------|------------|----------|
| great | 🎉 | Green (#15803d) | Major milestones, excellent progress |
| good | 😊 | Green (#16a34a) | Positive status, on track |
| neutral | 😐 | Gray (#4b5563) | Steady state, no major changes |
| concerned | 😟 | Amber (#b45309) | Minor issues, needs attention |
| warning | ⚠️ | Amber (#d97706) | Significant blockers, at risk |

### Confidence Badge Colors

| Level | Background | Text | Border |
|-------|-----------|------|--------|
| excellent | Emerald 500 (#10b981) | White | None |
| good | Green 500 (#22c55e) | White | None |
| medium | Amber 500 (#f59e0b) | White | None |
| poor | Red 500 (#ef4444) | White | None |
| na | Gray 400 (#9ca3af) | White | None |

## Initial Data Setup

### Seed Data (5 Initiatives)
**Note**: Seed data must be created after user authentication is set up, as each initiative requires a `user_id`.

```sql
-- After user signs up, insert initiatives with their user_id
-- Replace 'USER_UUID_HERE' with the actual authenticated user's ID
INSERT INTO initiatives (name, user_id) VALUES
  ('Shop', 'USER_UUID_HERE'),
  ('Open Banking', 'USER_UUID_HERE'),
  ('Engage Layer', 'USER_UUID_HERE'),
  ('ACE', 'USER_UUID_HERE'),
  ('Engage to Activate', 'USER_UUID_HERE');
```

## Security Considerations

### Current Implementation
- **Authentication**: Supabase Auth with email/password login
- **Authorization**: Row Level Security (RLS) policies on all tables
- **Data Isolation**: Users can only access their own data via RLS
- **Session Management**: Handled by Supabase Auth with persistent sessions
- **Password Security**: Managed by Supabase (hashed, secure)
- **User Scope**: Multi-user ready with user_id isolation

### Security Features Implemented
- **Row Level Security (RLS)**: Enabled on all tables (initiatives, updates, tasks)
- **Policy Enforcement**: All CRUD operations check user ownership via `auth.uid()`
- **Cascade Security**: Child tables (updates, tasks) inherit security from parent relationships
- **Protected Routes**: All application routes require authentication
- **Public Routes**: Only login, signup, and password reset pages accessible without auth

## Authentication Flow

### User Registration (Sign Up)
1. User visits `/signup` page
2. User enters email and password
3. Client calls `supabase.auth.signUp({ email, password })`
4. Supabase creates user account
5. On successful signup, redirect to dashboard

### User Login (Sign In)
1. User visits `/login` page (or auto-redirected if not authenticated)
2. User enters email and password
3. Client calls `supabase.auth.signInWithPassword({ email, password })`
4. On success, Supabase returns session token
5. Session stored in browser
6. Redirect to `/dashboard`

### Session Management
- Sessions persist across browser sessions via Supabase storage
- Client checks session on app load: `supabase.auth.getSession()`
- Auto-refresh tokens before expiry
- Logout clears session: `supabase.auth.signOut()`

## Core Features

### Dual Save System (Added v1.1)
Two distinct save actions provide better update management:

1. **Save New Update** (Pink gradient button)
   - Creates a new update entry in the timeline
   - Adds to historical record
   - Use for: Weekly updates, major status changes, significant progress

2. **Edit Current** (Gray button)
   - Updates the existing/latest update without creating new timeline entry
   - Modifies update record in place
   - Replaces associated tasks
   - Use for: Fixing typos, adjusting confidence levels, minor corrections

**Implementation:**
- `handleSaveNew()`: Inserts new update record
- `handleEditCurrent()`: Updates existing update, deletes old tasks, inserts updated tasks
- "Edit Current" only visible when latestUpdate exists

### Task Management with Due Dates (Added v1.2)

**Features:**
- Date picker on each task (editable mode only)
- Working days countdown in summary: "in X working days"
- Displays nearest upcoming incomplete task deadline
- Excludes weekends (Sat/Sun) from working days calculation

**Utility Functions (lib/utils.ts):**
```typescript
calculateWorkingDays(targetDate: string): number
formatWorkingDaysUntil(dateStr: string | null): string | null
```

**Display Formats:**
- "Due today" - same day
- "in 1 working day" - singular
- "in X working days" - plural
- "Overdue" - past due date

**Database:**
- `tasks.due_date`: DATE field, nullable
- Index on due_date for performance

### Form Pre-population (Added v1.2)

**Behavior:**
- When expanding an initiative card, form automatically loads previous update values
- Includes: confidence levels, mood, status text, risk/worry, tasks, department alignment
- Implemented via useEffect hook watching `latestUpdate` changes
- Fetches tasks associated with latest update
- Makes editing faster - tweak existing values rather than start from scratch

**Implementation:**
```typescript
useEffect(() => {
  if (latestUpdate) {
    setConfidencePlan(latestUpdate.confidence_plan || 'medium')
    setConfidenceAlignment(latestUpdate.confidence_alignment || 'medium')
    // ... populate all form fields

    // Fetch tasks from latest update
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('update_id', latestUpdate.id)
      .order('display_order')

    if (tasksData) setTasks(tasksData)
  }
}, [latestUpdate])
```

## UI Interaction Patterns

### Inline Editing Model
- **No Modal Dialog**: All editing happens directly in the expanded card view
- **Editable Fields**:
  - Confidence: Dropdown selects for each dimension (Plan, Alignment, Execution, Outcomes)
  - Status mood: Interactive emoji selector with hover/scale effects
  - Status text: Textarea (inline editable)
  - Tasks: Text inputs with checkboxes and date pickers (add/remove/complete)
  - Risk/Worry: Textarea (inline editable)
  - Department alignment: Checkboxes
- **Dual Save Buttons**: "Save New Update" and "Edit Current" positioned above timeline
- **Button Styling**: Smaller on desktop (py-2.5 px-4, text-sm), side-by-side layout
- **Persistence**: Card remains expanded after save

### Event Handling
- **Prevent Card Collapse**: Use `event.stopPropagation()` on:
  - Checkboxes (tasks, department alignment)
  - Buttons (Save New Update, Edit Current, Load More, Add Task, task removal)
  - Labels (containing checkboxes)
  - Select dropdowns (confidence selectors)
  - Text inputs and textareas (all editable fields)
  - Date pickers (task due dates)
  - Radio buttons (emoji selectors)

### Task Management UI
- **Inline Task Editing**:
  - Each task: checkbox + text input + date picker + remove button (✕)
  - Date picker shows below task text when editing
  - "+ Add Task" button appends new task row
  - Tasks display in order by display_order field
- **Completion States**:
  - Checked: Text shown with strikethrough and gray color, fields disabled
  - Unchecked: Normal text, fields editable
- **Timeline Display**:
  - Non-editable mode shows task text and due date (if set)
  - Format: "Due: MM/DD/YYYY"

### Emoji Selection
- **Interactive Mood Selector**:
  - Large emojis (text-4xl) with hover effects
  - Selected: opacity-100, scale-110
  - Unselected: opacity-40, scale-100
  - Hover: opacity-100, scale-110
  - Smooth transitions on all state changes
- **Summary Display**: Emoji appears next to initiative title (text-3xl)

### Timeline Pagination
- **Load More/Show Less**:
  - Default: Show 3 most recent updates
  - "Load More" button reveals older entries
  - "Show Less" collapses back to 3
  - Button text toggles between states

### Visual Hierarchy
- **Card Structure**:
  - Initiative title: text-2xl, font-bold
  - Timestamp: text-xs, uppercase, tight spacing to heading (mb-1)
  - Confidence badges: Compact pills with vibrant colors, no level text
  - Nearest deadline: Displayed with calendar emoji and pink accent color
  - Latest status: Highlighted in gray box (bg-gray-50, rounded-lg, p-4)
  - Open tasks: Listed with checkboxes and due dates

- **Expanded View Sections**:
  - Alternating white/gray backgrounds for visual separation
  - Section headers: text-lg, font-bold
  - Form fields: border-2, text-base, larger padding
  - Buttons: Smaller footprint (py-2.5), side-by-side layout

## API Integration

### Key Queries

1. **Fetch all initiatives with latest update and open tasks**
   ```typescript
   // Fetch initiatives
   const { data: initiatives } = await supabase
     .from('initiatives')
     .select('*')
     .eq('user_id', user.id)
     .order('name')

   // For each initiative, fetch latest update
   const { data: latestUpdate } = await supabase
     .from('updates')
     .select('*')
     .eq('initiative_id', initiative.id)
     .order('created_at', { ascending: false })
     .limit(1)
     .single()

   // Fetch open tasks with due dates
   const { data: openTasks } = await supabase
     .from('tasks')
     .select('*')
     .eq('update_id', latestUpdate.id)
     .eq('is_completed', false)
     .order('display_order')
   ```

2. **Fetch initiative timeline with tasks**
   ```typescript
   // Get all updates for initiative
   const { data: updates } = await supabase
     .from('updates')
     .select('*')
     .eq('initiative_id', initiativeId)
     .order('created_at', { ascending: false })

   // For each update, fetch tasks
   const { data: tasks } = await supabase
     .from('tasks')
     .select('*')
     .eq('update_id', update.id)
     .order('display_order')
   ```

3. **Create new update with tasks**
   ```typescript
   // Insert update
   const { data: newUpdate } = await supabase
     .from('updates')
     .insert({
       initiative_id,
       confidence_plan,
       confidence_alignment,
       confidence_execution,
       confidence_outcomes,
       status_mood,
       latest_status,
       biggest_risk_worry,
       dept_product_aligned,
       dept_tech_aligned,
       dept_marketing_aligned,
       dept_client_success_aligned,
       dept_commercial_aligned
     })
     .select()
     .single()

   // Insert tasks with due dates
   const tasksToInsert = tasks.map((task, index) => ({
     update_id: newUpdate.id,
     task_text: task.task_text,
     is_completed: task.is_completed,
     display_order: index,
     due_date: task.due_date
   }))

   await supabase.from('tasks').insert(tasksToInsert)
   ```

4. **Edit existing update**
   ```typescript
   // Update existing update
   await supabase
     .from('updates')
     .update({
       confidence_plan,
       confidence_alignment,
       // ... all fields
     })
     .eq('id', latestUpdate.id)

   // Delete old tasks
   await supabase.from('tasks').delete().eq('update_id', latestUpdate.id)

   // Insert updated tasks
   await supabase.from('tasks').insert(tasksToInsert)
   ```

## Performance Considerations

### Optimization Strategy
- Server-side rendering for initial page load
- Client-side state for interactive updates
- Optimistic UI updates (task completion, form state)
- Timeline pagination: Load 3 recent updates initially, fetch remaining on demand
- Working days calculation: Client-side only, no server calls
- Task date filtering: Database index on due_date for performance

### Caching
- Static generation where possible
- Revalidate on update submission
- Client-side caching for initiative list

## Development Environment Setup

### Required Tools
- Node.js 18+
- npm/yarn/pnpm
- Git
- Supabase account
- Vercel account

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development server (Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Auto-deploy on push to main branch
4. Production URL: https://strategic-initiative-tracker.vercel.app

### Supabase Setup
1. Create new Supabase project
2. Run schema SQL scripts
3. Add due_date column to tasks table:
   ```sql
   ALTER TABLE tasks ADD COLUMN due_date DATE;
   CREATE INDEX idx_tasks_due_date ON tasks(due_date);
   ```
4. Copy project URL and anon key to Vercel environment variables

## Future Enhancements

### Planned Features
- AI-powered insights using Claude API
- Email reminders for upcoming deadlines
- Markdown support in text fields
- Export to PDF
- Dashboard analytics view
- Bulk task operations
- Custom initiative templates

### Technical Debt
- None currently identified
- Milestones successfully removed and replaced with task due dates
- All components use consistent styling patterns
