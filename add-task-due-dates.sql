-- Add due_date column to tasks table
ALTER TABLE tasks
ADD COLUMN due_date DATE;

-- Add an index for faster queries on due dates
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
