/**
 * Migration: Add badges_hr column
 * Usage: node run_add_hackerrank_badges.js
 */

const db = require("./config/db");
const { logger } = require("./utils");

const runMigration = async () => {
  try {
    logger.info("Adding badges_hr column to student_performance...");

    await db.query(
      `ALTER TABLE student_performance ADD COLUMN IF NOT EXISTS badges_hr INT DEFAULT 0 COMMENT 'HackerRank Total Badges Count'`
    );
    logger.info("✓ Added badges_hr column");

    // Verify
    const [columns] = await db.query(`DESCRIBE student_performance`);
    const hasBadgesHr = columns.find((col) => col.Field === "badges_hr");

    if (hasBadgesHr) {
      logger.info("✓ Migration successful!");
      logger.info(`  - badges_hr: ${hasBadgesHr.Type}`);
    } else {
      logger.error("✗ Migration failed - column not found");
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
};

runMigration();
