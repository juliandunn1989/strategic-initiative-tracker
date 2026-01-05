-- Migrate existing "medium" values to "started" and update constraints
-- This maintains data continuity while changing the label

-- Step 1: Update all existing "medium" values to "started"
UPDATE updates SET confidence_plan = 'started' WHERE confidence_plan = 'medium';
UPDATE updates SET confidence_alignment = 'started' WHERE confidence_alignment = 'medium';
UPDATE updates SET confidence_execution = 'started' WHERE confidence_execution = 'medium';
UPDATE updates SET confidence_outcomes = 'started' WHERE confidence_outcomes = 'medium';

-- Step 2: Update constraints to use "started" instead of "medium"
ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_confidence_plan_check;
ALTER TABLE updates ADD CONSTRAINT updates_confidence_plan_check
  CHECK (confidence_plan IN ('poor', 'started', 'good', 'excellent', 'na'));

ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_confidence_alignment_check;
ALTER TABLE updates ADD CONSTRAINT updates_confidence_alignment_check
  CHECK (confidence_alignment IN ('poor', 'started', 'good', 'excellent', 'na'));

ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_confidence_execution_check;
ALTER TABLE updates ADD CONSTRAINT updates_confidence_execution_check
  CHECK (confidence_execution IN ('poor', 'started', 'good', 'excellent', 'na'));

ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_confidence_outcomes_check;
ALTER TABLE updates ADD CONSTRAINT updates_confidence_outcomes_check
  CHECK (confidence_outcomes IN ('poor', 'started', 'good', 'excellent', 'na'));
