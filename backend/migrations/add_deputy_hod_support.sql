-- Migration: Add Deputy HOD Support
-- Description: Add is_deputy_hod column to hod_profiles table to support Deputy HOD role

ALTER TABLE hod_profiles ADD COLUMN is_deputy_hod BOOLEAN DEFAULT FALSE AFTER dept_code;

-- Update any existing HOD records to ensure is_deputy_hod is set to FALSE
UPDATE hod_profiles SET is_deputy_hod = FALSE WHERE is_deputy_hod IS NULL;
