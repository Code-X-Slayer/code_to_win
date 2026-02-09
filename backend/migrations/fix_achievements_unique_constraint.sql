-- Fix existing student_achievements table to remove unique constraint
-- This allows users to add up to 2 achievements per type

-- Step 1: Check current structure
DESCRIBE student_achievements;

-- Step 2: Rename column if it's called 'type' (some versions may have this)
ALTER TABLE student_achievements CHANGE COLUMN IF EXISTS type achievement_type ENUM('certification', 'hackathon', 'workshop') NOT NULL;

-- Step 3: Remove the unique constraint that restricts 1 per type
-- This constraint prevents adding multiple achievements of the same type
ALTER TABLE student_achievements DROP INDEX IF EXISTS unique_student_type;

-- Step 4: Verify the unique constraint is removed
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'student_achievements' AND COLUMN_NAME = 'student_id';

-- Step 5: Verify table structure
DESCRIBE student_achievements;

-- Step 6: Test - should now be able to add 2 certifications for same student
-- SELECT COUNT(*) FROM student_achievements WHERE student_id = '23A91A05I2' AND achievement_type = 'certification';
