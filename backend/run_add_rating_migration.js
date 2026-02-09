/**
 * Migration Script: Add Rating Columns
 * Purpose: Add rating_lc and rating_cc columns to student_performance table
 * Usage: node run_add_rating_migration.js
 */

const db = require("./config/db");
const { logger } = require("./utils");

const runMigration = async () => {
  try {
    logger.info("Starting rating columns migration...");

    // Add rating columns if they don't exist
    await db.query(
      `ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS rating_lc INT DEFAULT 0 COMMENT 'LeetCode Contest Rating'`
    );
    logger.info("✓ Added rating_lc column to student_performance");

    await db.query(
      `ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS rating_cc INT DEFAULT 0 COMMENT 'CodeChef Rating'`
    );
    logger.info("✓ Added rating_cc column to student_performance");

    // Verify columns exist
    const [columns] = await db.query(`DESCRIBE student_performance`);
    const hasRatingLc = columns.find((col) => col.Field === "rating_lc");
    const hasRatingCc = columns.find((col) => col.Field === "rating_cc");

    if (hasRatingLc && hasRatingCc) {
      logger.info("✓ Migration completed successfully!");
      logger.info("✓ New columns:");
      logger.info(`  - rating_lc: ${hasRatingLc.Type}`);
      logger.info(`  - rating_cc: ${hasRatingCc.Type}`);
    } else {
      logger.warn("⚠ Some columns may not have been added properly");
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the migration
runMigration();
