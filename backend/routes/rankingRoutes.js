const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL connection
const { logger } = require("../utils"); // <-- Add logger
const updateAllRankings = require("../updateRankings");

// Calculate score expression for ranking
async function getScoreExpression() {
  const [gradingData] = await db.query("SELECT * FROM grading_system");
  // Example: (p.badges_hr * 5) + (p.basic_gfg * 1) + ...
  return gradingData
    .map((row) => `(p.${row.metric} * ${row.points})`)
    .join(" + ");
}

// GET /ranking/overall
router.get("/overall", async (req, res) => {
  logger.info("Fetching overall ranking");
  try {
    const scoreExpr = await getScoreExpression();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 20000)); // max 500
    const [rows] = await db.query(
      `SELECT 
  sp.student_id, 
  sp.*, 
  d.dept_name, 
  ${scoreExpr.replace(/p\.(\w+)/g, (match, metric) => {
    if (metric.includes("_lc"))
      return `CASE WHEN COALESCE(cp.leetcode_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_cc"))
      return `CASE WHEN COALESCE(cp.codechef_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_gfg"))
      return `CASE WHEN COALESCE(cp.geeksforgeeks_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_hr"))
      return `CASE WHEN COALESCE(cp.hackerrank_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_gh"))
      return `CASE WHEN COALESCE(cp.github_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    return match;
  })} AS score
FROM student_profiles sp
JOIN student_performance p ON sp.student_id = p.student_id
LEFT JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
JOIN dept d ON sp.dept_code = d.dept_code
WHERE sp.status = 'active'
ORDER BY score DESC, sp.student_id ASC
LIMIT ?`,
      [limit]
    );
    // Check if all scores are 0
    const allZero = rows.every((s) => s.score === 0);

    // If all scores are zero, sort by student_id (already handled by ORDER BY above)
    if (allZero) {
      rows.sort((a, b) => (a.student_id > b.student_id ? 1 : -1));
    }

    // Add rank field and update DB
    for (let i = 0; i < rows.length; i++) {
      rows[i].rank = i + 1;
      // Update the rank in the database
      await db.query(
        "UPDATE student_profiles SET score=?, overall_rank = ? WHERE student_id = ?",
        [rows[i].score, rows[i].rank, rows[i].student_id]
      );
    }

    // Fetch and attach performance data for each student
    for (const student of rows) {
      const [perfRows] = await db.query(
        `SELECT * FROM student_performance WHERE student_id = ?`,
        [student.student_id]
      );
      const [codingProfiles] = await db.query(
        `SELECT leetcode_status, codechef_status, geeksforgeeks_status, hackerrank_status, github_status FROM student_coding_profiles WHERE student_id = ?`,
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

        const totalSolved =
          (isLeetcodeAccepted ? p.easy_lc + p.medium_lc + p.hard_lc : 0) +
          (isGfgAccepted
            ? p.school_gfg +
              p.basic_gfg +
              p.easy_gfg +
              p.medium_gfg +
              p.hard_gfg
            : 0) +
          (isCodechefAccepted ? p.problems_cc : 0);

        const combined = {
          totalSolved: totalSolved,
          totalContests:
            (isCodechefAccepted ? p.contests_cc : 0) +
            (isGfgAccepted ? p.contests_gfg : 0),
          stars_cc: isCodechefAccepted ? p.stars_cc : 0,
          badges_hr: isHackerrankAccepted ? p.badges_hr : 0,
          last_updated: p.last_updated,
        };

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

        student.performance = {
          combined,
          platformWise,
        };
      }
    }

    logger.info(`Fetched overall ranking, count=${rows.length}`);
    res.json(rows);
  } catch (err) {
    logger.error(`Error fetching overall ranking: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /ranking/filter?department=CSE&section=A&year=3
router.get("/filter", async (req, res) => {
  const { dept, section, year } = req.query;
  logger.info(
    `Fetching filtered ranking: dept=${dept}, section=${section}, year=${year}`
  );
  try {
    const scoreExpr = await getScoreExpression();
    let where = "WHERE sp.status = 'active'";
    const params = [];
    if (dept) {
      where += " AND sp.dept_code = ?";
      params.push(dept);
    }
    if (section) {
      where += " AND sp.section = ?";
      params.push(section);
    }
    if (year) {
      where += " AND sp.year = ?";
      params.push(year);
    }
    if (req.query.search) {
      where += " AND (sp.name LIKE ? OR sp.roll_number LIKE ?)";
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 2000)); // max 1000
    const [rows] = await db.query(
      `SELECT 
  sp.*, 
  d.dept_name, 
  ${scoreExpr.replace(/p\.(\w+)/g, (match, metric) => {
    if (metric.includes("_lc"))
      return `CASE WHEN COALESCE(cp.leetcode_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_cc"))
      return `CASE WHEN COALESCE(cp.codechef_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_gfg"))
      return `CASE WHEN COALESCE(cp.geeksforgeeks_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_hr"))
      return `CASE WHEN COALESCE(cp.hackerrank_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_gh"))
      return `CASE WHEN COALESCE(cp.github_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    return match;
  })} AS score
FROM student_profiles sp
JOIN student_performance p ON sp.student_id = p.student_id
LEFT JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
JOIN dept d ON sp.dept_code = d.dept_code
${where}
ORDER BY score DESC, sp.student_id ASC
LIMIT ?`,
      [...params, limit]
    );

    // Check if all scores are 0
    const allZero = rows.every((s) => s.score === 0);
    if (allZero) {
      rows.sort((a, b) => (a.student_id > b.student_id ? 1 : -1));
    }

    rows.forEach((s, i) => (s.rank = i + 1));
    // Attach performance for each student
    for (const student of rows) {
      const [perfRows] = await db.query(
        `SELECT * FROM student_performance WHERE student_id = ?`,
        [student.student_id]
      );
      const [codingProfiles] = await db.query(
        `SELECT leetcode_status, codechef_status, geeksforgeeks_status, hackerrank_status, github_status FROM student_coding_profiles WHERE student_id = ?`,
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

        const totalSolved =
          (isLeetcodeAccepted ? p.easy_lc + p.medium_lc + p.hard_lc : 0) +
          (isGfgAccepted
            ? p.school_gfg +
              p.basic_gfg +
              p.easy_gfg +
              p.medium_gfg +
              p.hard_gfg
            : 0) +
          (isCodechefAccepted ? p.problems_cc : 0);

        const combined = {
          totalSolved: totalSolved,
          totalContests:
            (isCodechefAccepted ? p.contests_cc : 0) +
            (isGfgAccepted ? p.contests_gfg : 0),
          stars_cc: isCodechefAccepted ? p.stars_cc : 0,
          badges_hr: isHackerrankAccepted ? p.badges_hr : 0,
          last_updated: p.last_updated,
        };

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

        student.performance = {
          combined,
          platformWise,
        };
      }
    }
    logger.info(`Fetched filtered ranking, count=${rows.length}`);
    res.json(rows);
  } catch (err) {
    logger.error(`Error fetching filtered ranking: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /ranking/update-all
router.post("/update-all", async (req, res) => {
  logger.info("Manual ranking update triggered");
  try {
    const result = await updateAllRankings();
    if (result.success) {
      res.json({
        message: "Rankings updated successfully",
        studentsUpdated: result.studentsUpdated,
      });
    } else {
      res.status(500).json({
        message: "Failed to update rankings",
        error: result.error,
      });
    }
  } catch (err) {
    logger.error(`Error in manual ranking update: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /ranking/section - Get section leaderboard
router.get("/section", async (req, res) => {
  const { studentId } = req.query;
  
  logger.info(`Fetching section leaderboard for studentId: ${studentId}`);
  
  try {
    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // 1. Get the student's section, year, and department
    const [studentData] = await db.query(
      `SELECT student_id, dept_code, year, section, name, overall_rank, score
       FROM student_profiles
       WHERE student_id = ? AND status = 'active'`,
      [studentId]
    );

    if (studentData.length === 0) {
      logger.warn(`Student not found or inactive: ${studentId}`);
      return res.status(404).json({ message: "Student not found" });
    }

    const student = studentData[0];
    const { dept_code, year, section } = student;

    // 2. Get all students in the same section with ranking
    const scoreExpr = await getScoreExpression();
    
    const [rows] = await db.query(
      `SELECT 
        sp.student_id, 
        sp.name,
        sp.overall_rank,
        sp.score,
        sp.dept_code,
        sp.year,
        sp.section,
        d.dept_name,
        p.*,
        cp.leetcode_status,
        cp.codechef_status,
        cp.geeksforgeeks_status,
        cp.hackerrank_status,
        cp.github_status,
        ${scoreExpr.replace(/p\.(\w+)/g, (match, metric) => {
          if (metric.includes("_lc"))
            return `CASE WHEN COALESCE(cp.leetcode_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
          if (metric.includes("_cc"))
            return `CASE WHEN COALESCE(cp.codechef_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
          if (metric.includes("_gfg"))
            return `CASE WHEN COALESCE(cp.geeksforgeeks_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
          if (metric.includes("_hr"))
            return `CASE WHEN COALESCE(cp.hackerrank_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
          if (metric.includes("_gh"))
            return `CASE WHEN COALESCE(cp.github_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
          return match;
        })} AS calculated_score
      FROM student_profiles sp
      JOIN student_performance p ON sp.student_id = p.student_id
      LEFT JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
      JOIN dept d ON sp.dept_code = d.dept_code
      WHERE sp.status = 'active'
        AND sp.dept_code = ?
        AND sp.year = ?
        AND sp.section = ?
      ORDER BY calculated_score DESC, sp.student_id ASC`,
      [dept_code, year, section]
    );

    if (rows.length === 0) {
      logger.info(`No students found in section: dept=${dept_code}, year=${year}, section=${section}`);
      return res.json({
        leaderboard: [],
        studentRank: null,
        sectionInfo: {
          dept_code,
          year,
          section,
        },
        message: "Leaderboard data not available for your section yet.",
      });
    }

    // 3. Add rank and prepare response data
    const leaderboard = rows.map((row, index) => {
      const rank = index + 1;
      
      // For section leaderboard, show all platform data regardless of verification status
      // (This is for engagement/informational purposes, not official ranking)
      // Just check if any data exists (any solved problems, contests, etc.)
      const hasLeetcodeData = (row.easy_lc || row.medium_lc || row.hard_lc || row.contests_lc);
      const hasCodechefData = (row.problems_cc || row.contests_cc);
      const hasGfgData = (row.school_gfg || row.basic_gfg || row.easy_gfg || row.medium_gfg || row.hard_gfg || row.contests_gfg);
      const hasHackerrankData = (row.badges_hr || row.stars_hr);
      const hasGithubData = (row.repos_gh || row.contributions_gh);

      const totalSolved = 
        (hasLeetcodeData ? (row.easy_lc || 0) + (row.medium_lc || 0) + (row.hard_lc || 0) : 0) +
        (hasGfgData ? (row.school_gfg || 0) + (row.basic_gfg || 0) + (row.easy_gfg || 0) + (row.medium_gfg || 0) + (row.hard_gfg || 0) : 0) +
        (hasCodechefData ? row.problems_cc || 0 : 0);
      
      const totalContests =
        (hasLeetcodeData ? row.contests_lc || 0 : 0) +
        (hasCodechefData ? row.contests_cc || 0 : 0) +
        (hasGfgData ? row.contests_gfg || 0 : 0);

      return {
        rank,
        student_id: row.student_id,
        name: row.name,
        score: row.calculated_score || row.score || 0,
        dept_code: row.dept_code,
        dept_name: row.dept_name,
        year: row.year,
        section: row.section,
        combined: {
          totalSolved,
          totalContests,
        },
        performance: {
          platformWise: {
            leetcode: {
              easy: hasLeetcodeData ? row.easy_lc || 0 : 0,
              medium: hasLeetcodeData ? row.medium_lc || 0 : 0,
              hard: hasLeetcodeData ? row.hard_lc || 0 : 0,
              contests: hasLeetcodeData ? row.contests_lc || 0 : 0,
              rating: hasLeetcodeData ? row.rating_lc || 0 : 0,
              badges: hasLeetcodeData ? row.badges_lc || 0 : 0,
            },
            codechef: {
              problems: hasCodechefData ? row.problems_cc || 0 : 0,
              contests: hasCodechefData ? row.contests_cc || 0 : 0,
              rating: hasCodechefData ? row.rating_cc || 0 : 0,
              stars: hasCodechefData ? row.stars_cc || 0 : 0,
              badges: hasCodechefData ? row.badges_cc || 0 : 0,
            },
            gfg: {
              school: hasGfgData ? row.school_gfg || 0 : 0,
              basic: hasGfgData ? row.basic_gfg || 0 : 0,
              easy: hasGfgData ? row.easy_gfg || 0 : 0,
              medium: hasGfgData ? row.medium_gfg || 0 : 0,
              hard: hasGfgData ? row.hard_gfg || 0 : 0,
              contests: hasGfgData ? row.contests_gfg || 0 : 0,
            },
            hackerrank: {
              badges: hasHackerrankData ? row.badges_hr || 0 : 0,
              totalStars: hasHackerrankData ? row.stars_hr || 0 : 0,
            },
            github: {
              repos: hasGithubData ? row.repos_gh || 0 : 0,
              contributions: hasGithubData ? row.contributions_gh || 0 : 0,
            },
          },
        },
      };
    });

    // 4. Find the logged-in student's rank
    const studentRank = leaderboard.find((s) => s.student_id === studentId);

    logger.info(
      `Section leaderboard fetched: dept=${dept_code}, year=${year}, section=${section}, count=${leaderboard.length}`
    );

    res.json({
      leaderboard,
      studentRank,
      sectionInfo: {
        dept_code,
        dept_name: rows[0].dept_name,
        year,
        section,
      },
    });
  } catch (err) {
    logger.error(`Error fetching section leaderboard: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
