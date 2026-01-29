/**
 * Quick script to scrape a single user's profile
 * Usage: node scrape_single_user.js <student_id>
 * Example: node scrape_single_user.js 23A91A05I2
 */

const db = require("./config/db");
const { logger } = require("./utils");
const { scrapeAndUpdatePerformance } = require("./scrapers/scrapeAndUpdatePerformance");

async function scrapeSingleUser(studentId) {
  try {
    logger.info(`Fetching profile for student: ${studentId}`);

    // Get student's coding profiles
    const [profiles] = await db.query(
      `SELECT leetcode_id, codechef_id, geeksforgeeks_id, hackerrank_id, github_id,
              leetcode_status, codechef_status, geeksforgeeks_status, hackerrank_status, github_status
       FROM student_coding_profiles WHERE student_id = ?`,
      [studentId]
    );

    if (profiles.length === 0) {
      logger.error(`No coding profiles found for student: ${studentId}`);
      process.exit(1);
    }

    const profile = profiles[0];
    const scrapePromises = [];

    // Scrape LeetCode
    if (profile.leetcode_status === 'accepted' && profile.leetcode_id) {
      logger.info(`Scraping LeetCode for ${profile.leetcode_id}...`);
      scrapePromises.push(
        scrapeAndUpdatePerformance(studentId, 'leetcode', profile.leetcode_id)
          .then(() => logger.info(`✓ LeetCode updated`))
          .catch(err => logger.error(`✗ LeetCode failed: ${err.message}`))
      );
    }

    // Scrape CodeChef
    if (profile.codechef_status === 'accepted' && profile.codechef_id) {
      logger.info(`Scraping CodeChef for ${profile.codechef_id}...`);
      scrapePromises.push(
        scrapeAndUpdatePerformance(studentId, 'codechef', profile.codechef_id)
          .then(() => logger.info(`✓ CodeChef updated`))
          .catch(err => logger.error(`✗ CodeChef failed: ${err.message}`))
      );
    }

    // Scrape GeeksforGeeks
    if (profile.geeksforgeeks_status === 'accepted' && profile.geeksforgeeks_id) {
      logger.info(`Scraping GeeksforGeeks for ${profile.geeksforgeeks_id}...`);
      scrapePromises.push(
        scrapeAndUpdatePerformance(studentId, 'geeksforgeeks', profile.geeksforgeeks_id)
          .then(() => logger.info(`✓ GeeksforGeeks updated`))
          .catch(err => logger.error(`✗ GeeksforGeeks failed: ${err.message}`))
      );
    }

    // Scrape HackerRank
    if (profile.hackerrank_status === 'accepted' && profile.hackerrank_id) {
      logger.info(`Scraping HackerRank for ${profile.hackerrank_id}...`);
      scrapePromises.push(
        scrapeAndUpdatePerformance(studentId, 'hackerrank', profile.hackerrank_id)
          .then(() => logger.info(`✓ HackerRank updated`))
          .catch(err => logger.error(`✗ HackerRank failed: ${err.message}`))
      );
    }

    // Scrape GitHub
    if (profile.github_status === 'accepted' && profile.github_id) {
      logger.info(`Scraping GitHub for ${profile.github_id}...`);
      scrapePromises.push(
        scrapeAndUpdatePerformance(studentId, 'github', profile.github_id)
          .then(() => logger.info(`✓ GitHub updated`))
          .catch(err => logger.error(`✗ GitHub failed: ${err.message}`))
      );
    }

    if (scrapePromises.length === 0) {
      logger.warn(`No accepted profiles to scrape for ${studentId}`);
      process.exit(0);
    }

    // Execute all scrapes in parallel
    await Promise.all(scrapePromises);

    logger.info(`\n✓ Scraping complete for ${studentId}. Refresh your browser to see updated ratings!`);
    process.exit(0);

  } catch (error) {
    logger.error(`Error scraping user: ${error.message}`);
    process.exit(1);
  }
}

// Get student ID from command line
const studentId = process.argv[2];

if (!studentId) {
  console.error('Usage: node scrape_single_user.js <student_id>');
  console.error('Example: node scrape_single_user.js 23A91A05I2');
  process.exit(1);
}

scrapeSingleUser(studentId);
