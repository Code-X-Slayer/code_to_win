-- Achievements Migration Script
-- This script updates the student_achievements table to support the new achievement system

-- 1. Drop the old table if it exists (if you want a fresh start) - CAREFUL!
-- DROP TABLE IF EXISTS student_achievements;

-- 2. Recreate or alter the student_achievements table with the correct schema
-- Note: Removed UNIQUE KEY unique_student_type to allow up to 2 achievements per type
CREATE TABLE IF NOT EXISTS student_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  achievement_type ENUM('certification', 'hackathon', 'workshop') NOT NULL,
  subtype VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  proof_url VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected', 'accepted') DEFAULT 'accepted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_achievements_student FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Add missing columns if they don't exist (these won't error if they already exist)
ALTER TABLE student_achievements ADD COLUMN IF NOT EXISTS subtype VARCHAR(50);
ALTER TABLE student_achievements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE student_achievements MODIFY COLUMN achievement_type ENUM('certification', 'hackathon', 'workshop') NOT NULL;
ALTER TABLE student_achievements MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'accepted') DEFAULT 'accepted';

-- 4. Remove old unique constraint if it exists (allows multiple achievements per type)
ALTER TABLE student_achievements DROP INDEX IF EXISTS unique_student_type;

-- 5. Update grading system if not exists
INSERT IGNORE INTO grading_system (metric, points) VALUES 
('certification_count', 5),
('hackathon_winner_count', 10),
('hackathon_participation_count', 5),
('workshop_count', 5);

-- 6. Add achievement counter columns to student_performance if they don't exist
ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS certification_count INT DEFAULT 0;
ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS hackathon_winner_count INT DEFAULT 0;
ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS hackathon_participation_count INT DEFAULT 0;
ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS workshop_count INT DEFAULT 0;

-- 7. Verify the table structure
DESCRIBE student_achievements;

-- 8. Create a migration script to fix existing database if needed
-- Run this if you're updating an existing database:
-- ALTER TABLE student_achievements RENAME COLUMN type TO achievement_type;
-- ALTER TABLE student_achievements DROP INDEX IF EXISTS unique_student_type;
