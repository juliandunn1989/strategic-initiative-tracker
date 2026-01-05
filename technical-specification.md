# Strategic Initiative Tracker - Technical Specification

⚠️ **IMPORTANT: UPDATE CHANGELOG BELOW WHENEVER MAKING CHANGES** ⚠️

## CHANGELOG

### Version 1.0 (2026-01-05)
- Initial technical specification created
- Tech stack: Next.js 14+, React, TypeScript, Tailwind CSS, Supabase, Vercel
- Database schema: initiatives, updates, tasks, milestones tables
- Inline editing model (no modal dialog)
- Multiple milestones feature with add/remove functionality
- Timeline pagination (show 3, load more)
- Field rename: "Biggest Blocker" → "Biggest Risk/Worry"
- **Authentication added**: Supabase Auth with email/password
- **Row Level Security (RLS)**: User data isolation policies implemented
- **user_id** field added to initiatives table for multi-user support

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (keeping it simple for V1)

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase REST API
- **Authentication**: None in V1 (planned for V2 with Supabase Auth)

### Hosting & Deployment
- **Platform**: Vercel
- **Environment**: Production deployment via Vercel

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
- `latest_status`: Text (replaces whats_changed)
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
  display_order INTEGER NOT NULL
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

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

### Table: `milestones`
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

-- RLS Policy: Users can only see milestones for their own initiatives
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

**Fields:**
- `id`: UUID, primary key
- `update_id`: UUID, foreign key → updates.id (cascade delete)
- `milestone_text`: Text, not null
- `target_date`: Date, nullable
- `display_order`: Integer (for maintaining milestone order)

### Data Relationships
- **One-to-Many**: One initiative has many updates
- **One-to-Many**: One update has many tasks
- **One-to-Many**: One update has many milestones
- **Many-to-One**: Updates always belong to one initiative
- **Many-to-One**: Tasks always belong to one update
- **Many-to-One**: Milestones always belong to one update
- **Current State Logic**: Most recent update determines initiative's "current state"
- **Cascade Delete**: When an update is deleted, all associated tasks and milestones are deleted

### Mood Emoji Mapping

| Mood | Emoji | Text Color | Use Case |
|------|-------|------------|----------|
| great | 🎉 | Green (#15803d) | Major milestones, excellent progress |
| good | 😊 | Green (#16a34a) | Positive status, on track |
| neutral | 😐 | Gray (#4b5563) | Steady state, no major changes |
| concerned | 😟 | Amber (#b45309) | Minor issues, needs attention |
| warning | ⚠️ | Amber (#d97706) | Significant blockers, at risk |

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

**Alternative Approach**: Create an initialization function that runs on first login:
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

## Security Considerations

### V1 (Current)
- **Authentication**: Supabase Auth with email/password login
- **Authorization**: Row Level Security (RLS) policies on all tables
- **Data Isolation**: Users can only access their own data via RLS
- **Session Management**: Handled by Supabase Auth with persistent sessions
- **Password Security**: Managed by Supabase (hashed, secure)
- **User Scope**: Single user design, but architecture supports multi-user

### Security Features Implemented
- **Row Level Security (RLS)**: Enabled on all tables (initiatives, updates, tasks, milestones)
- **Policy Enforcement**: All CRUD operations check user ownership via `auth.uid()`
- **Cascade Security**: Child tables (updates, tasks, milestones) inherit security from parent relationships
- **Protected Routes**: All application routes require authentication
- **Public Routes**: Only login, signup, and password reset pages accessible without auth

### Future Security Enhancements (V2+)
- Social login providers (Google, GitHub, etc.)
- Two-factor authentication (2FA)
- Session timeout configuration
- IP-based access controls
- Audit logging for sensitive operations

## Authentication Flow

### User Registration (Sign Up)
1. User visits `/signup` page
2. User enters email and password
3. Client calls `supabase.auth.signUp({ email, password })`
4. Supabase creates user account and sends confirmation email
5. User confirms email (optional, can be disabled in Supabase settings)
6. On successful signup, redirect to dashboard
7. Initialize user's 5 default initiatives via `initialize_user_initiatives()` function

### User Login (Sign In)
1. User visits `/login` page (or auto-redirected if not authenticated)
2. User enters email and password
3. Client calls `supabase.auth.signInWithPassword({ email, password })`
4. On success, Supabase returns session token
5. Session stored in browser (localStorage/cookies)
6. Redirect to `/dashboard`

### Password Reset
1. User clicks "Forgot Password?" on login page
2. User enters email address
3. Client calls `supabase.auth.resetPasswordForEmail(email)`
4. Supabase sends password reset email
5. User clicks link in email, redirected to reset page
6. User enters new password
7. Client calls `supabase.auth.updateUser({ password: newPassword })`
8. Redirect to login page

### Session Management
- Sessions persist across browser sessions via Supabase storage
- Client checks session on app load: `supabase.auth.getSession()`
- Auto-refresh tokens before expiry
- Logout clears session: `supabase.auth.signOut()`

### Protected Routes
All routes except `/login`, `/signup`, `/reset-password` require authentication:
- Check session in middleware or layout component
- Redirect to `/login` if no valid session
- Pass authenticated user to child components via context

### Supabase Client Configuration
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Server-Side Authentication (Next.js App Router)
```typescript
// app/actions/auth.ts
'use server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getUser() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

## Implementation Phases

### Phase 1: Hardcoded Wireframe (~2 hours)
- Static HTML/CSS with dummy data
- Interactive prototype (expand/collapse, form interactions)
- Validate information architecture and UX flow

### Phase 2: Backend Setup (~1 hour)
- Create Supabase project
- Define schema and create tables
- Seed initial data (5 initiatives)
- Test API endpoints

### Phase 3: Core Build (~4-5 hours)
- Next.js app structure setup
- Dashboard with initiative cards
- Detail view with all sections
- Update form and submission logic
- Timeline display with reverse chronological order

### Phase 4: Polish (~2 hours)
- Responsive design refinement
- Loading states and transitions
- Error handling
- Mobile testing (320px - 1920px)

**Total Estimated Build Time**: 8-10 hours

## Technical Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Supabase free tier rate limits | Usage will be very low (single user, <100 requests/day), well within free tier |
| No auth means anyone with URL can access | Use obscure Vercel URL, add auth in V2 if needed |
| Mobile performance with large timelines | Implement pagination or "load more" if timeline exceeds 20 entries |

## API Integration

### Supabase Client Configuration
- Use Supabase JavaScript client
- Environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Key Queries

1. **Fetch all initiatives with latest update, open tasks, and upcoming milestones**
   ```sql
   SELECT i.*, u.*,
     (SELECT json_agg(t.*)
      FROM tasks t
      WHERE t.update_id = u.id AND t.is_completed = false
      ORDER BY t.display_order
     ) as open_tasks,
     (SELECT json_agg(m.* ORDER BY m.target_date, m.display_order)
      FROM milestones m
      WHERE m.update_id = u.id
     ) as upcoming_milestones
   FROM initiatives i
   LEFT JOIN LATERAL (
     SELECT * FROM updates
     WHERE initiative_id = i.id
     ORDER BY created_at DESC
     LIMIT 1
   ) u ON true
   ORDER BY i.name;
   ```

2. **Fetch initiative timeline with tasks and milestones (paginated)**
   ```sql
   -- Get recent 3 updates
   SELECT u.*,
     (SELECT json_agg(t.* ORDER BY t.display_order)
      FROM tasks t
      WHERE t.update_id = u.id
     ) as tasks,
     (SELECT json_agg(m.* ORDER BY m.target_date, m.display_order)
      FROM milestones m
      WHERE m.update_id = u.id
     ) as milestones
   FROM updates u
   WHERE u.initiative_id = $1
   ORDER BY u.created_at DESC
   LIMIT 3;

   -- Get all updates (for "Load More")
   SELECT u.*,
     (SELECT json_agg(t.* ORDER BY t.display_order)
      FROM tasks t
      WHERE t.update_id = u.id
     ) as tasks,
     (SELECT json_agg(m.* ORDER BY m.target_date, m.display_order)
      FROM milestones m
      WHERE m.update_id = u.id
     ) as milestones
   FROM updates u
   WHERE u.initiative_id = $1
   ORDER BY u.created_at DESC;
   ```

3. **Create new update with tasks and milestones**
   ```sql
   -- Insert update
   INSERT INTO updates (
     initiative_id, confidence_plan, confidence_alignment,
     confidence_execution, confidence_outcomes, status_mood,
     latest_status, biggest_risk_worry,
     dept_product_aligned, dept_tech_aligned, dept_marketing_aligned,
     dept_client_success_aligned, dept_commercial_aligned
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
   RETURNING *;

   -- Insert tasks
   INSERT INTO tasks (update_id, task_text, is_completed, display_order)
   VALUES ($1, $2, $3, $4)
   RETURNING *;

   -- Insert milestones
   INSERT INTO milestones (update_id, milestone_text, target_date, display_order)
   VALUES ($1, $2, $3, $4)
   RETURNING *;
   ```

4. **Toggle task completion**
   ```sql
   UPDATE tasks
   SET is_completed = NOT is_completed
   WHERE id = $1
   RETURNING *;
   ```

## UI Interaction Patterns

### Inline Editing Model
- **No Modal Dialog**: All editing happens directly in the expanded card view
- **Editable Fields**:
  - Confidence: Dropdown selects for each dimension
  - Status mood: Radio button emoji selector
  - Status text: Textarea (inline editable)
  - Tasks: Text inputs with checkboxes (add/remove/complete)
  - Risk/Worry: Textarea (inline editable, renamed from "blocker")
  - Milestones: Multiple milestone entries with text input + date picker (add/remove)
  - Department alignment: Checkboxes
- **Save Button**: "Save Changes" button positioned above timeline
- **Persistence**: Card remains expanded after save

### Event Handling
- **Prevent Card Collapse**: Use `event.stopPropagation()` on:
  - Checkboxes (tasks, department alignment)
  - Buttons (Save Changes, Load More, Add Task, task removal)
  - Labels (containing checkboxes)
  - Select dropdowns (confidence selectors)
  - Text inputs and textareas (all editable fields)
  - Radio buttons (emoji selectors)

### Task Management
- **Inline Task Editing**:
  - Each task is a text input field (not static text)
  - Checkbox + text input + remove button (✕)
  - "+ Add Task" button appends new task row
- **Strikethrough Toggle**:
  - Listen for `change` event on task checkboxes
  - For text inputs: Add strikethrough, disable field
  - For spans (timeline): Add strikethrough, gray color
  - Toggle logic handles both INPUT and SPAN elements

### Milestone Management
- **Inline Milestone Editing**:
  - Each milestone has text input (name) + date picker (target date)
  - Text input + date picker + remove button (✕)
  - "+ Add Milestone" button appends new milestone row
  - Milestones sorted by target date in timeline display
  - No completion status (unlike tasks)

### Timeline Pagination
- **Load More/Show Less**:
  - Default: Show 3 most recent updates
  - "Load More" button reveals hidden older entries
  - Toggle button text between "Load More" and "Show Less"
  - Smooth transition using Tailwind's `hidden` class

### Emoji Selection
- **Inline Mood Selector**:
  - Radio button group with visual emoji labels
  - Each initiative has unique radio group name (e.g., `shop-status-emoji`)
  - Selected emoji has full opacity (1), others at 50% opacity
  - Visual feedback on selection
  - Applies to both inline editing and timeline display

## Performance Considerations

### Optimization Strategy
- Server-side rendering for initial page load
- Client-side state for interactive updates
- Optimistic UI updates before API confirmation
- Timeline pagination: Load 3 recent updates initially, fetch remaining on demand
- Task completion updates: Optimistic UI toggle with background sync

### Caching
- Static generation where possible
- Revalidate on update submission
- Client-side caching for initiative list

## Future Technical Enhancements

### V2 (Near-term)
- Supabase Auth integration
- Row Level Security policies
- Edit/delete update functionality
- Basic AI analysis integration (Claude API)

### Medium-term
- Email reminders (Supabase Edge Functions + Resend/SendGrid)
- Markdown support in text fields
- File attachment support (Supabase Storage)
- Export to PDF (jsPDF or similar)

### Long-term
- Multi-user support with role-based access
- External integrations (Notion, Linear, etc.)
- Advanced AI coaching features
- Mobile native apps (React Native)

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
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Auto-deploy on push to main branch
4. Preview deployments for pull requests

### Supabase Setup
1. Create new Supabase project
2. Run schema SQL scripts
3. Run seed data SQL scripts
4. Copy project URL and anon key to Vercel environment variables
5. Configure CORS if needed (allow Vercel domain)
