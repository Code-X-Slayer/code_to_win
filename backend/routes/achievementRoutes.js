const express = require("express");
const router = express.Router();
const db = require("../config/db");
const upload = require("../middleware/uploadMiddleware");
const { logger } = require("../utils");
const updateAllRankings = require("../updateRankings");

const ALLOWED_TYPES = ["certification", "hackathon", "workshop"];
const HACKATHON_SUBTYPES = ["participation", "winner"];

const recalculateAchievementCounts = async (studentId) => {
  const [rows] = await db.query(
    "SELECT achievement_type, subtype FROM student_achievements WHERE student_id = ? ORDER BY created_at DESC",
    [studentId]
  );

  // Count achievements per type (max 2 each)
  let certificationCount = 0;
  let hackathonWinnerCount = 0;
  let hackathonParticipationCount = 0;
  let workshopCount = 0;

  rows.forEach((row) => {
    if (row.achievement_type === "certification" && certificationCount < 2) {
      certificationCount++;
    } else if (row.achievement_type === "workshop" && workshopCount < 2) {
      workshopCount++;
    } else if (row.achievement_type === "hackathon") {
      if (row.subtype === "winner" && hackathonWinnerCount < 2) {
        hackathonWinnerCount++;
      } else if (row.subtype !== "winner" && hackathonParticipationCount < 2) {
        hackathonParticipationCount++;
      }
    }
  });

  await db.query(
    `UPDATE student_performance
     SET certification_count = ?,
         hackathon_winner_count = ?,
         hackathon_participation_count = ?,
         workshop_count = ?
     WHERE student_id = ?`,
    [
      certificationCount,
      hackathonWinnerCount,
      hackathonParticipationCount,
      workshopCount,
      studentId,
    ]
  );

  try {
    await updateAllRankings();
  } catch (rankErr) {
    logger.error(`Failed to update rankings: ${rankErr.message}`);
  }
};

// POST /api/achievements/add - Student creates or updates an achievement
router.post("/add", upload.single("file"), async (req, res) => {
  const { studentId, type, title, date, description, subtype, achievementId } = req.body;
  const proofUrl = req.file
    ? `/uploads/certificates/${req.file.filename}`
    : null;

  logger.info(`Saving achievement for studentId=${studentId}, type=${type}`);

  try {
    if (!studentId || !type || !title || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid achievement type" });
    }

    const normalizedSubtype =
      type === "hackathon"
        ? HACKATHON_SUBTYPES.includes(subtype)
          ? subtype
          : "participation"
        : null;

    // If updating existing achievement
    if (achievementId) {
      const [existingRows] = await db.query(
        "SELECT id, proof_url FROM student_achievements WHERE id = ? AND student_id = ?",
        [achievementId, studentId]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ message: "Achievement not found" });
      }

      const existing = existingRows[0];
      const effectiveProofUrl = proofUrl || existing.proof_url;
      await db.query(
        `UPDATE student_achievements
         SET subtype = ?, title = ?, date = ?, description = ?, proof_url = ?, status = 'accepted'
         WHERE id = ?`,
        [
          normalizedSubtype,
          title,
          date,
          description,
          effectiveProofUrl,
          achievementId,
        ]
      );
    } else {
      // Check if user already has 2 achievements of this type
      const [existingOfType] = await db.query(
        "SELECT COUNT(*) as count FROM student_achievements WHERE student_id = ? AND achievement_type = ?",
        [studentId, type]
      );

      if (existingOfType[0].count >= 2) {
        return res.status(400).json({
          message: `Maximum 2 ${type} achievements allowed. Please edit or delete an existing one.`,
        });
      }

      // Add new achievement
      await db.query(
        `INSERT INTO student_achievements (student_id, achievement_type, subtype, title, date, description, proof_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'accepted')`,
        [
          studentId,
          type,
          normalizedSubtype,
          title,
          date,
          description,
          proofUrl,
        ]
      );
    }

    await recalculateAchievementCounts(studentId);

    logger.info(`Achievement saved successfully for studentId=${studentId}`);
    res.json({ message: "Achievement saved successfully" });
  } catch (err) {
    logger.error(`Error saving achievement: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/achievements/my-achievements - Get achievements for a student
router.get("/my-achievements", async (req, res) => {
  const { studentId } = req.query;
  try {
    const [rows] = await db.query(
      "SELECT id, student_id, achievement_type AS type, subtype, title, date, description, proof_url AS file_path, created_at, updated_at FROM student_achievements WHERE student_id = ? ORDER BY FIELD(achievement_type, 'certification', 'hackathon', 'workshop')",
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    logger.error(
      `Error fetching achievements for student ${studentId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/achievements/pending - Get pending achievements for faculty approval
router.get("/pending", async (req, res) => {
  const { facultyId } = req.query;
  logger.info(`Fetching pending achievements for facultyId=${facultyId}`);

  try {
    if (!facultyId) {
      return res.status(400).json({ message: "Faculty ID required" });
    }

    const [achievements] = await db.query(
      `SELECT 
        sa.id, sa.student_id, sa.achievement_type AS type, sa.subtype, 
        sa.title, sa.date, sa.description, sa.proof_url AS file_path, 
        sa.created_at, sa.updated_at,
        sp.name AS student_name, sp.student_id AS roll_number,
        sp.year, sp.section
      FROM student_achievements sa
      JOIN student_profiles sp ON sa.student_id = sp.student_id
      WHERE sa.status IN ('pending', 'approved', 'rejected')
      ORDER BY sa.created_at DESC`,
      []
    );

    res.json(achievements);
  } catch (err) {
    logger.error(`Error fetching pending achievements: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/achievements/:id - Student deletes an achievement
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.query; // Ensure ownership

  logger.info(`Deleting achievement ${id} by student ${studentId}`);

  try {
    // Verify ownership
    const [rows] = await db.query(
      "SELECT * FROM student_achievements WHERE id = ? AND student_id = ?",
      [id, studentId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Achievement not found or unauthorized" });
    }

    // Delete DB Record
    await db.query("DELETE FROM student_achievements WHERE id = ?", [id]);

    await recalculateAchievementCounts(studentId);

    res.json({ message: "Achievement deleted successfully" });
  } catch (err) {
    logger.error(`Error deleting achievement ${id}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
