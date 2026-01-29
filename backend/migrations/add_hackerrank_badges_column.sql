-- Add missing HackerRank columns to student_performance table

ALTER TABLE student_performance 
ADD COLUMN IF NOT EXISTS badges_hr INT DEFAULT 0 COMMENT 'HackerRank Total Badges Count';

-- Verify the column was added
DESCRIBE student_performance;
