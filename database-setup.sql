-- Strategic Initiative Tracker - Complete Database Setup
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- TABLE 1: INITIATIVES
-- ============================================

CREATE TABLE initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for initiatives
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


-- ============================================
-- TABLE 2: UPDATES
-- ============================================

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

-- RLS Policies for updates
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


-- ============================================
-- TABLE 3: TASKS
-- ============================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
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


-- ============================================
-- TABLE 4: MILESTONES
-- ============================================

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
  milestone_text TEXT NOT NULL,
  target_date DATE,
  display_order INTEGER NOT NULL
);

-- Enable Row Level Security
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for milestones
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


-- ============================================
-- INITIALIZATION FUNCTION
-- ============================================

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
