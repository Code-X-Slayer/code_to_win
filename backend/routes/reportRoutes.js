const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { logger } = require("../utils");
const { generateCodingPointsReport } = require("../utils/reportGenerator");

// GET /api/reports/coding-points - Generate specialized report
router.get("/coding-points", async (req, res) => {
  const { dept, year, section, userId } = req.query;

  logger.info(
    `Generating Coding Points Report for Dept: ${dept}, Year: ${year}, Section: ${section}`
  );

  try {
    // 1. Fetch Department naming
    const [deptRows] = await db.query(
      "SELECT dept_name FROM dept WHERE dept_code = ?",
      [dept]
    );
    const deptName = deptRows[0]?.dept_name || dept;

    // 2. Fetch Students matching the filters
    let query = `
      SELECT sp.*, u.email, d.dept_name
      FROM student_profiles sp
      JOIN users u ON sp.student_id = u.user_id
      JOIN dept d ON sp.dept_code = d.dept_code
      WHERE sp.status = 'active'
    `;
    const params = [];

    if (dept) {
      query += " AND sp.dept_code = ?";
      params.push(dept);
    }
    if (year) {
      query += " AND sp.year = ?";
      params.push(year);
    }
    if (section) {
      query += " AND sp.section = ?";
      params.push(section);
    }

    query += " ORDER BY sp.student_id ASC";
    const [students] = await db.query(query, params);

    // 3. Fetch performance for each student (similar to adminRoutes)
    for (const student of students) {
      const [perfRows] = await db.query(
        `SELECT * FROM student_performance WHERE student_id = ?`,
        [student.student_id]
      );
      const [codingProfiles] = await db.query(
        `SELECT leetcode_status, codechef_status, geeksforgeeks_status, hackerrank_status, github_status 
         FROM student_coding_profiles WHERE student_id = ?`,
        [student.student_id]
      );

      if (perfRows.length > 0) {
        const p = perfRows[0];
        const cp = codingProfiles[0] || {};

        const isLeetcodeAccepted = cp.leetcode_status === "accepted";
        const isCodechefAccepted = cp.codechef_status === "accepted";
        const isGfgAccepted = cp.geeksforgeeks_status === "accepted";
        const isHackerrankAccepted = cp.hackerrank_status === "accepted";
        const isGithubAccepted = cp.github_status === "accepted";

        const platformWise = {
          leetcode: {
            easy: isLeetcodeAccepted ? p.easy_lc : 0,
            medium: isLeetcodeAccepted ? p.medium_lc : 0,
            hard: isLeetcodeAccepted ? p.hard_lc : 0,
            contests: isLeetcodeAccepted ? p.contests_lc : 0,
            rating: isLeetcodeAccepted ? p.rating_lc : 0,
            badges: isLeetcodeAccepted ? p.badges_lc : 0,
          },
          gfg: {
            school: isGfgAccepted ? p.school_gfg : 0,
            basic: isGfgAccepted ? p.basic_gfg : 0,
            easy: isGfgAccepted ? p.easy_gfg : 0,
            medium: isGfgAccepted ? p.medium_gfg : 0,
            hard: isGfgAccepted ? p.hard_gfg : 0,
            contests: isGfgAccepted ? p.contests_gfg : 0,
          },
          codechef: {
            problems: isCodechefAccepted ? p.problems_cc : 0,
            contests: isCodechefAccepted ? p.contests_cc : 0,
            rating: isCodechefAccepted ? p.rating_cc : 0,
            stars: isCodechefAccepted ? p.stars_cc : 0,
            badges: isCodechefAccepted ? p.badges_cc : 0,
          },
          hackerrank: {
            badges: isHackerrankAccepted 
              ? (p.badges_hr || JSON.parse(p.badgesList_hr || "[]").length)
              : 0,
            totalStars: isHackerrankAccepted ? p.stars_hr : 0,
            badgesList: isHackerrankAccepted
              ? JSON.parse(p.badgesList_hr || "[]")
              : [],
          },
          github: {
            repos: isGithubAccepted ? p.repos_gh : 0,
            contributions: isGithubAccepted ? p.contributions_gh : 0,
          },
        };

        const [achievementRows] = await db.query(
          "SELECT id, student_id, achievement_type AS type, subtype, title, date, description, proof_url AS file_path, created_at, updated_at FROM student_achievements WHERE student_id = ? ORDER BY FIELD(achievement_type, 'certification', 'hackathon', 'workshop')",
          [studentId]
        );

        student.performance = { platformWise };
        student.achievements = achievementRows;
      }
    }

    // 4. Generate Report
    const buffer = await generateCodingPointsReport(students, {
      deptName,
      year,
      section,
      date: new Date().toLocaleDateString("en-GB"),
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Coding_Points_${dept}_${year}_${section}.xlsx"`
    );

    res.send(buffer);
  } catch (err) {
    logger.error(`Error generating report: ${err.message}`);
    res.status(500).json({ message: "Server error generating report" });
  }
});

module.exports = router;
