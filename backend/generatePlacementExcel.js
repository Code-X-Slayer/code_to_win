/**
 * Generate Excel file for placement eligibility list
 */

const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const { logger } = require("./utils");

async function generatePlacementExcel(data) {
  const { companyName, filters, eligibleStudents } = data;
  const workbook = new ExcelJS.Workbook();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.join(__dirname, "exports");
  const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, "_");
  const outputPath = path.join(
    outputDir,
    `${sanitizedCompanyName}_Placement_Eligibility_${timestamp}.xlsx`
  );

  // Ensure exports directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Create main worksheet
    const worksheet = workbook.addWorksheet("Eligible Students");

    // Add company header
    worksheet.mergeCells("A1:L1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `${companyName} - Placement Eligibility List`;
    titleCell.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0066CC" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 30;

    // Add filter criteria section
    let currentRow = 3;
    worksheet.getCell(`A${currentRow}`).value = "Applied Filter Criteria:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;

    // Branches
    worksheet.getCell(`A${currentRow}`).value = "Branches:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = filters.branches.join(", ");
    currentRow++;

    // Years
    worksheet.getCell(`A${currentRow}`).value = "Years:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = filters.years.join(", ");
    currentRow++;

    // Platform score thresholds
    if (filters.leetcodeMin !== undefined) {
      worksheet.getCell(`A${currentRow}`).value = "LeetCode Minimum Score:";
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = filters.leetcodeMin;
      currentRow++;
    }

    if (filters.geeksforgeeksMin !== undefined) {
      worksheet.getCell(`A${currentRow}`).value =
        "GeeksforGeeks Minimum Score:";
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = filters.geeksforgeeksMin;
      currentRow++;
    }

    if (filters.hackerrankMin !== undefined) {
      worksheet.getCell(`A${currentRow}`).value = "HackerRank Minimum Score:";
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = filters.hackerrankMin;
      currentRow++;
    }

    if (filters.codechefMin !== undefined) {
      worksheet.getCell(`A${currentRow}`).value = "CodeChef Minimum Score:";
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = filters.codechefMin;
      currentRow++;
    }

    if (filters.githubMin !== undefined) {
      worksheet.getCell(`A${currentRow}`).value = "GitHub Minimum Score:";
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = filters.githubMin;
      currentRow++;
    }

    currentRow++; // Add spacing

    // Total eligible students
    worksheet.getCell(`A${currentRow}`).value = "Total Eligible Students:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    worksheet.getCell(`B${currentRow}`).value = eligibleStudents.length;
    worksheet.getCell(`B${currentRow}`).font = { bold: true, size: 12 };
    currentRow += 2; // Add spacing before table

    // Add student data table
    const headerRow = currentRow;
    const headers = [
      "S.No",
      "Student ID",
      "Name",
      "Email",
      "Department",
      "Year",
      "Section",
      "LeetCode ID",
      "LeetCode Score",
      "GeeksforGeeks ID",
      "GeeksforGeeks Score",
      "CodeChef ID",
      "CodeChef Score",
      "HackerRank ID",
      "HackerRank Score",
      "GitHub ID",
      "GitHub Score",
    ];

    // Set column headers
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRow, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Set column widths
    worksheet.columns = [
      { width: 8 }, // S.No
      { width: 15 }, // Student ID
      { width: 25 }, // Name
      { width: 30 }, // Email
      { width: 25 }, // Department
      { width: 8 }, // Year
      { width: 10 }, // Section
      { width: 20 }, // LeetCode ID
      { width: 15 }, // LeetCode Score
      { width: 20 }, // GeeksforGeeks ID
      { width: 18 }, // GeeksforGeeks Score
      { width: 20 }, // CodeChef ID
      { width: 15 }, // CodeChef Score
      { width: 20 }, // HackerRank ID
      { width: 16 }, // HackerRank Score
      { width: 20 }, // GitHub ID
      { width: 15 }, // GitHub Score
    ];

    // Add student data
    eligibleStudents.forEach((student, index) => {
      const rowIndex = headerRow + index + 1;
      const row = [
        index + 1,
        student.student_id,
        student.name,
        student.email,
        student.dept_name,
        student.year,
        student.section,
        student.leetcode_id || "N/A",
        student.leetcode_score,
        student.geeksforgeeks_id || "N/A",
        student.geeksforgeeks_score,
        student.codechef_id || "N/A",
        student.codechef_score,
        student.hackerrank_id || "N/A",
        student.hackerrank_score,
        student.github_id || "N/A",
        student.github_score,
      ];

      row.forEach((value, colIndex) => {
        const cell = worksheet.getCell(rowIndex, colIndex + 1);
        cell.value = value;
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };

        // Alternate row colors for better readability
        if (index % 2 === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F0F0" },
          };
        }
      });
    });

    // Add footer with generation timestamp
    const footerRow = headerRow + eligibleStudents.length + 2;
    worksheet.getCell(`A${footerRow}`).value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.getCell(`A${footerRow}`).font = { italic: true, size: 10 };

    // Write to file
    await workbook.xlsx.writeFile(outputPath);
    logger.info(`Placement Excel file generated: ${outputPath}`);

    return outputPath;
  } catch (error) {
    logger.error(`Error generating placement Excel: ${error.message}`);
    throw error;
  }
}

module.exports = generatePlacementExcel;
