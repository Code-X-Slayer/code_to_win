-- Migration Script: Add LeetCode and CodeChef Rating Columns
-- Purpose: Add rating columns to student_performance table to track platform ratings

ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS rating_lc INT DEFAULT 0 COMMENT 'LeetCode Contest Rating';
ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS rating_cc INT DEFAULT 0 COMMENT 'CodeChef Rating';

-- Verify columns were added
DESCRIBE student_performance;
