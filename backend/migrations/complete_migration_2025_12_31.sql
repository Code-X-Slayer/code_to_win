-- ============================================================================
-- CodeTracker Database Migration
-- Date: 2025-12-31
-- Description: Comprehensive migration for all schema updates
-- ============================================================================

USE code_to_win;

-- ============================================================================
-- 1. MULTI-SECTION SUPPORT FOR FACULTY
-- ============================================================================

-- Backup existing faculty assignments
CREATE TABLE IF NOT EXISTS faculty_section_assignment_backup AS 
SELECT * FROM faculty_section_assignment;

-- Drop existing constraints
ALTER TABLE faculty_section_assignment 
DROP FOREIGN KEY IF EXISTS faculty_section_assignment_ibfk_1;

ALTER TABLE faculty_section_assignment DROP PRIMARY KEY;

-- Add composite primary key (faculty_id, year, section)
ALTER TABLE faculty_section_assignment 
ADD PRIMARY KEY (faculty_id, year, section);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_faculty_assignments ON faculty_section_assignment(faculty_id);

-- Recreate foreign key constraint
ALTER TABLE faculty_section_assignment
ADD CONSTRAINT faculty_section_assignment_ibfk_1 
FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(faculty_id);

-- ============================================================================
-- 2. ACHIEVEMENTS TRACKING
-- ============================================================================

-- Add achievement columns to student_performance if they don't exist
ALTER TABLE student_performance
ADD COLUMN IF NOT EXISTS certification_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS hackathon_winner_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS hackathon_participation_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS workshop_count INT DEFAULT 0;

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  achievement_type ENUM('certification', 'hackathon_winner', 'hackathon_participation', 'workshop') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE,
  proof_url VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
  INDEX idx_student_achievements (student_id),
  INDEX idx_achievement_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 3. DEPARTMENT BATCH CONFIGURATIONS
-- ============================================================================

-- Create dept_batch_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS dept_batch_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dept_code VARCHAR(10) NOT NULL,
  batch INT NOT NULL,
  num_sections INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_dept_batch (dept_code, batch),
  FOREIGN KEY (dept_code) REFERENCES dept(dept_code) ON DELETE CASCADE,
  INDEX idx_dept_batch (dept_code, batch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 4. ENSURE SCORE COLUMN IN STUDENT_PROFILES
-- ============================================================================

-- Add score column if it doesn't exist
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS score DECIMAL(10,2) DEFAULT 0.00;

-- Add overall_rank column if it doesn't exist
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS overall_rank INT DEFAULT NULL;

-- ============================================================================
-- 5. GITHUB INTEGRATION
-- ============================================================================

-- Ensure GitHub columns exist in student_performance
ALTER TABLE student_performance
ADD COLUMN IF NOT EXISTS repos_gh INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS contributions_gh INT DEFAULT 0;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT 'Migration completed successfully!' AS status;

-- Verify faculty_section_assignment structure
SELECT 'Checking faculty_section_assignment...' AS step;
SHOW COLUMNS FROM faculty_section_assignment;

-- Verify student_performance structure
SELECT 'Checking student_performance...' AS step;
SHOW COLUMNS FROM student_performance;

-- Verify student_achievements table
SELECT 'Checking student_achievements...' AS step;
SHOW TABLES LIKE 'student_achievements';

-- Verify dept_batch_configs table
SELECT 'Checking dept_batch_configs...' AS step;
SHOW TABLES LIKE 'dept_batch_configs';

-- Verify student_profiles has score column
SELECT 'Checking student_profiles...' AS step;
SHOW COLUMNS FROM student_profiles LIKE 'score';

SELECT 'All migrations completed successfully!' AS final_status;
