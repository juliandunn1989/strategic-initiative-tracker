-- Add 'na' as an option to all confidence fields
-- This allows users to mark any confidence dimension as "Not Applicable"

-- Update confidence_plan constraint
ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_confidence_plan_check;
ALTER TABLE updates ADD CONSTRAINT updates_confidence_plan_check
  CHECK (confidence_plan IN ('poor', 'medium', 'good', 'excellent', 'na'));

-- Update confidence_alignment constraint
ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_confidence_alignment_check;
ALTER TABLE updates ADD CONSTRAINT updates_confidence_alignment_check
  CHECK (confidence_alignment IN ('poor', 'medium', 'good', 'excellent', 'na'));

-- Update confidence_execution constraint
ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_confidence_execution_check;
ALTER TABLE updates ADD CONSTRAINT updates_confidence_execution_check
  CHECK (confidence_execution IN ('poor', 'medium', 'good', 'excellent', 'na'));

-- Confidence_outcomes already has 'na', but let's ensure it's consistent
ALTER TABLE updates DROP CONSTRAINT IF EXISTS updates_confidence_outcomes_check;
ALTER TABLE updates ADD CONSTRAINT updates_confidence_outcomes_check
  CHECK (confidence_outcomes IN ('poor', 'medium', 'good', 'excellent', 'na'));
