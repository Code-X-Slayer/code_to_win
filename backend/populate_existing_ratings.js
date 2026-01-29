/**
 * One-time script to populate ratings for existing users
 * Run this after adding rating columns to populate data from existing profiles
 * Usage: node populate_existing_ratings.js
 */

const db = require("./config/db");
const { logger } = require("./utils");
const {
  scrapeAndUpdatePerformance,
  scrapeAllProfiles,
} = require("./scrapers/scrapeAndUpdatePerformance");

async function populateRatings(batchSize = 50, delayMs = 3000) {
  try {
    logger.info("Starting rating population for existing users...");

    // Get all students with accepted LeetCode or CodeChef profiles who have rating = 0
    const [students] = await db.query(
      `SELECT DISTINCT scp.student_id, scp.leetcode_id, scp.codechef_id,
              scp.leetcode_status, scp.codechef_status,
              sp.rating_lc, sp.rating_cc
       FROM student_coding_profiles scp
       LEFT JOIN student_performance sp ON scp.student_id = sp.student_id
       WHERE ((scp.leetcode_status = 'accepted' AND scp.leetcode_id IS NOT NULL AND (sp.rating_lc IS NULL OR sp.rating_lc = 0))
          OR (scp.codechef_status = 'accepted' AND scp.codechef_id IS NOT NULL AND (sp.rating_cc IS NULL OR sp.rating_cc = 0)))
       LIMIT ${batchSize}`
    );

    logger.info(`Found ${students.length} students with missing ratings (processing ${batchSize} at a time)`);

    if (students.length === 0) {
      logger.info("✓ All ratings are already populated!");
      process.exit(0);
    }

    let leetcodeCount = 0;
    let codechefCount = 0;
    let processedCount = 0;

    for (const student of students) {
      const { student_id, leetcode_id, codechef_id, leetcode_status, codechef_status, rating_lc, rating_cc } = student;
      
      processedCount++;
      logger.info(`[${processedCount}/${students.length}] Processing: ${student_id}`);

      // Scrape LeetCode if accepted and rating is 0
      if (leetcode_status === 'accepted' && leetcode_id && (!rating_lc || rating_lc === 0)) {
        try {
          await scrapeAndUpdatePerformance(student_id, 'leetcode', leetcode_id);
          leetcodeCount++;
          logger.info(`✓ Updated LeetCode rating for ${student_id}`);
        } catch (err) {
          logger.error(`✗ Failed to update LeetCode for ${student_id}: ${err.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      // Scrape CodeChef if accepted and rating is 0
      if (codechef_status === 'accepted' && codechef_id && (!rating_cc || rating_cc === 0)) {
        try {
          await scrapeAndUpdatePerformance(student_id, 'codechef', codechef_id);
          codechefCount++;
          logger.info(`✓ Updated CodeChef rating for ${student_id}`);
        } catch (err) {
          logger.error(`✗ Failed to update CodeChef for ${student_id}: ${err.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    logger.info("===== Rating Population Batch Complete =====");
    logger.info(`✓ LeetCode profiles updated: ${leetcodeCount}`);
    logger.info(`✓ CodeChef profiles updated: ${codechefCount}`);
    logger.info(`✓ Total students processed: ${processedCount}`);
    
    // Check if there are more students to process
    const [remaining] = await db.query(
      `SELECT COUNT(DISTINCT scp.student_id) as count
       FROM student_coding_profiles scp
       LEFT JOIN student_performance sp ON scp.student_id = sp.student_id
       WHERE ((scp.leetcode_status = 'accepted' AND scp.leetcode_id IS NOT NULL AND (sp.rating_lc IS NULL OR sp.rating_lc = 0))
          OR (scp.codechef_status = 'accepted' AND scp.codechef_id IS NOT NULL AND (sp.rating_cc IS NULL OR sp.rating_cc = 0)))`
    );
    
    const remainingCount = remaining[0].count;
    if (remainingCount > 0) {
      logger.info(`\n⚠️  ${remainingCount} students still need ratings. Run this script again to process more.`);
    } else {
      logger.info(`\n✓ All students have been processed!`);
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Error populating ratings: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  populateRatings();
}

module.exports = populateRatings;
