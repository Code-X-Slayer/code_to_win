const ExcelJS = require("exceljs");
const { logger } = require("../utils");

/**
 * Generate the specialized Coding Points Calculation Excel report
 * @param {Array} students - List of students with performance data
 * @param {Object} metadata - { deptName, year, section, date }
 * @returns {Buffer} - Excel workbook buffer
 */
async function generateCodingPointsReport(students, metadata) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Coding Points");

  const { deptName, year, section, date } = metadata;

  // Set page setup for landscape and better fitting
  sheet.pageSetup.orientation = "landscape";
  sheet.pageSetup.fitToPage = true;

  // Define Header Structure
  // Row 1: University Name & Department
  sheet.mergeCells("A1:Q1");
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = `ADITYA UNIVERSITY`;
  titleRow.getCell(1).font = { size: 16, bold: true };
  titleRow.getCell(1).alignment = { horizontal: "center" };

  sheet.mergeCells("A2:Q2");
  const deptRow = sheet.getRow(2);
  deptRow.getCell(1).value = `Department of ${deptName}`;
  deptRow.getCell(1).font = { size: 12, bold: true };
  deptRow.getCell(1).alignment = { horizontal: "center" };

  // Row 3: Class info, Report Title, Date
  sheet.mergeCells("A3:F3");
  sheet.getCell("A3").value = `Class/Section: ${year} ${section}`;

  sheet.mergeCells("G3:L3");
  sheet.getCell("G3").value = "Coding Points Calculation";
  sheet.getCell("G3").font = { bold: true };
  sheet.getCell("G3").alignment = { horizontal: "center" };

  sheet.mergeCells("M3:Q3");
  sheet.getCell("M3").value = date || new Date().toLocaleDateString();
  sheet.getCell("M3").alignment = { horizontal: "right" };

  // Row 4 & 5: Table Headers (Merged)
  // Define columns
  // 1: S.No, 2: Roll No
  // 3-8: Hacker Rank (1, 2, 3, 4, 5, T)
  // 9-12: Coding Platforms (E, M, H, T)
  // 13-14: Participations (Internal, External)
  // 15-21: Coding Challenges (B/S, 1, 2, 3, 4, 5, Total)
  // 22: Grand Total

  sheet.mergeCells("A4:A5");
  sheet.getCell("A4").value = "S.No";
  sheet.mergeCells("B4:B5");
  sheet.getCell("B4").value = "Roll No";

  sheet.mergeCells("C4:H4");
  sheet.getCell("C4").value = "Hacker Rank Star/Badges";
  sheet.getCell("C5").value = "1";
  sheet.getCell("D5").value = "2";
  sheet.getCell("E5").value = "3";
  sheet.getCell("F5").value = "4";
  sheet.getCell("G5").value = "5";
  sheet.getCell("H5").value = "T";

  sheet.mergeCells("I4:L4");
  sheet.getCell("I4").value = "Coding Platforms (LC/CC/GFG etc..)";
  sheet.getCell("I5").value = "E";
  sheet.getCell("J5").value = "M";
  sheet.getCell("K5").value = "H";
  sheet.getCell("L5").value = "T";

  sheet.mergeCells("M4:N4");
  sheet.getCell("M4").value = "Participations";
  sheet.getCell("M5").value = "Internal";
  sheet.getCell("N5").value = "External";

  sheet.mergeCells("O4:P4");
  sheet.getCell("O4").value = "GitHub";
  sheet.getCell("O5").value = "Repos";
  sheet.getCell("P5").value = "Contributions";

  sheet.mergeCells("Q4:Q5");
  sheet.getCell("Q4").value = "Grand Total";

  // Style Headers
  [4, 5].forEach((rowNum) => {
    const row = sheet.getRow(rowNum);
    row.font = { bold: true };
    row.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" },
      };
    });
  });

  // Add Student Data
  students.forEach((student, index) => {
    const rowNum = index + 6;
    const p = student.performance?.platformWise || {};
    const c = student.performance?.combined || {};

    // Map HackerRank stars (1-5)
    // Aggregate badges by star level from badgesList array
    const hrBadges = p.hackerrank?.badgesList || [];
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    hrBadges.forEach((badge) => {
      const stars = badge.stars || 0;
      if (stars >= 1 && stars <= 5) {
        starCounts[stars]++;
      }
    });

    const row = sheet.getRow(rowNum);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = student.student_id;

    // HR 1-5 (count of badges at each star level)
    for (let i = 1; i <= 5; i++) {
      row.getCell(2 + i).value = starCounts[i];
    }
    row.getCell(8).value = hrBadges.length; // Total badges

    // Coding Platforms E, M, H, T
    // Include CodeChef problems in Easy category
    const easy =
      (p.leetcode?.easy || 0) +
      (p.gfg?.school || 0) +
      (p.gfg?.basic || 0) +
      (p.gfg?.easy || 0) +
      (p.codechef?.problems || 0);
    const medium = (p.leetcode?.medium || 0) + (p.gfg?.medium || 0);
    const hard = (p.leetcode?.hard || 0) + (p.gfg?.hard || 0);
    const total = easy + medium + hard;

    row.getCell(9).value = easy;
    row.getCell(10).value = medium;
    row.getCell(11).value = hard;
    row.getCell(12).value = total;

    // Participations
    const internal =
      (p.leetcode?.contests || 0) +
      (p.codechef?.contests || 0) +
      (p.gfg?.contests || 0);
    const external =
      (p.achievements?.hackathon_participation || 0) +
      (p.achievements?.hackathon_winners || 0);

    row.getCell(13).value = internal;
    row.getCell(14).value = external;

    // GitHub Repos and Contributions
    row.getCell(15).value = p.github?.repos || 0;
    row.getCell(16).value = p.github?.contributions || 0;

    // Grand Total
    row.getCell(17).value = student.score || 0;

    // Style data rows
    row.alignment = { horizontal: "center" };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Set column widths
  sheet.getColumn(1).width = 5; // S.No
  sheet.getColumn(2).width = 15; // Roll No
  for (let i = 3; i <= 16; i++) {
    sheet.getColumn(i).width = 5;
  }
  sheet.getColumn(17).width = 12; // Grand Total

  // Add Summary Table at the bottom (optional, but requested in image)
  const lastRow = students.length + 8;
  sheet.getCell(`A${lastRow}`).value = "E";
  sheet.getCell(`B${lastRow}`).value = "Easy";
  sheet.getCell(`A${lastRow + 1}`).value = "M";
  sheet.getCell(`B${lastRow + 1}`).value = "Medium";
  sheet.getCell(`A${lastRow + 2}`).value = "H";
  sheet.getCell(`B${lastRow + 2}`).value = "Hard";
  sheet.getCell(`A${lastRow + 3}`).value = "T";
  sheet.getCell(`B${lastRow + 3}`).value = "Target Achieved";

  return await workbook.xlsx.writeBuffer();
}

module.exports = { generateCodingPointsReport };
