/**
 * Quick script to check rating values in database
 */

const db = require("./config/db");
const { logger } = require("./utils");

async function checkRatings(studentId) {
  try {
    const [rows] = await db.query(
      `SELECT rating_lc, rating_cc, contests_lc, contests_cc, easy_lc, medium_lc, hard_lc, problems_cc 
       FROM student_performance WHERE student_id = ?`,
      [studentId]
    );

    if (rows.length === 0) {
      logger.error(`No performance data found for ${studentId}`);
    } else {
      const data = rows[0];
      logger.info(`Database values for ${studentId}:`);
      logger.info(`  LeetCode Rating: ${data.rating_lc}`);
      logger.info(`  CodeChef Rating: ${data.rating_cc}`);
      logger.info(`  LeetCode Contests: ${data.contests_lc}`);
      logger.info(`  CodeChef Contests: ${data.contests_cc}`);
      logger.info(`  LeetCode Problems: ${data.easy_lc + data.medium_lc + data.hard_lc}`);
      logger.info(`  CodeChef Problems: ${data.problems_cc}`);
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

const studentId = process.argv[2] || "23A91A05I2";
checkRatings(studentId);
