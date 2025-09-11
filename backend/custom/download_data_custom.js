const XLSX = require("xlsx");
const scrapeLeetCodeProfile = require("../scrapers/leetcode");
const scrapeCodeChefProfile = require("../scrapers/codechef");
const scrapeHackerRankProfile = require("../scrapers/hackerrank");

// Configure your Excel file path here
const EXCEL_FILE_PATH = "./AECT_3rd_year_input.xlsx"; // Change this to your Excel file path
const OUTPUT_FILE_PATH = "./AECT_3rd_year_stats_11092025.xlsx";

// Progress tracking
let progressStats = {
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  currentStudent: "",
};

function updateProgress(studentName, status) {
  progressStats.currentStudent = studentName;
  progressStats.processed++;
  if (status === "success") progressStats.successful++;
  else progressStats.failed++;

  const percentage = (
    (progressStats.processed / progressStats.total) *
    100
  ).toFixed(1);
  console.clear();
  console.log("=".repeat(50));
  console.log("📊 STUDENT DATA SCRAPING PROGRESS");
  console.log("=".repeat(50));
  console.log(
    `📈 Progress: ${progressStats.processed}/${progressStats.total} (${percentage}%)`
  );
  console.log(`✅ Successful: ${progressStats.successful}`);
  console.log(`❌ Failed: ${progressStats.failed}`);
  console.log(`🔄 Currently processing: ${studentName}`);
  console.log("=".repeat(50));
}

async function processStudentData() {
  console.log("🚀 Starting data scraping process...");

  // Read Excel file
  const workbook = XLSX.readFile(EXCEL_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const students = XLSX.utils.sheet_to_json(worksheet);

  progressStats.total = students.length;
  console.log(`📋 Found ${students.length} students to process`);

  const results = [];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const studentName = student["Student Name"];

    try {
      // Direct usernames from Excel columns
      const hackerrankUsername = student.HackerRank || "";
      const leetcodeUsername = student.LeetCode || "";
      const codechefUsername = student.CodeChef || "";

      // Scrape data using existing scraper functions
      let lcStats = { Problems: { Easy: 0, Medium: 0, Hard: 0 } };
      let hrStats = { Total_stars: 0 };
      let ccStats = { problemsSolved: 0 };

      if (leetcodeUsername) {
        try {
          lcStats = await scrapeLeetCodeProfile(
            `https://leetcode.com/${leetcodeUsername}/`
          );
        } catch (e) {
          console.log(e);
        }
      }

      if (hackerrankUsername) {
        try {
          hrStats = await scrapeHackerRankProfile(
            `https://www.hackerrank.com/${hackerrankUsername}`
          );
        } catch (e) {
          console.log(e);
        }
      }

      if (codechefUsername) {
        try {
          ccStats = await scrapeCodeChefProfile(
            `https://www.codechef.com/users/${codechefUsername}`
          );
        } catch (e) {
          console.log(e);
        }
      }

      const totalProblems =
        (lcStats.Problems?.Easy || 0) +
        (lcStats.Problems?.Medium || 0) +
        (lcStats.Problems?.Hard || 0) +
        (ccStats.problemsSolved || 0) +
        (hrStats.Total_stars || 0);

      results.push({
        "Student ID": student["Student Id"],
        Name: studentName,
        Department: student.Branch,
        Year: student.Year,
        "LC Easy": lcStats.Problems?.Easy || 0,
        "LC Medium": lcStats.Problems?.Medium || 0,
        "LC Hard": lcStats.Problems?.Hard || 0,
        "HR Stars": hrStats.Total_stars || 0,
        "CC Problems": ccStats.problemsSolved || 0,
        "Total Problems": totalProblems,
      });

      updateProgress(studentName, "success");
    } catch (error) {
      updateProgress(studentName, "failed");
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Create new Excel file
  const newWorkbook = XLSX.utils.book_new();
  const newWorksheet = XLSX.utils.json_to_sheet(results);
  XLSX.utils.book_append_sheet(
    newWorkbook,
    newWorksheet,
    "Student Coding Stats"
  );
  XLSX.writeFile(newWorkbook, OUTPUT_FILE_PATH);

  console.clear();
  console.log("🎉 DATA SCRAPING COMPLETED!");
  console.log("=".repeat(50));
  console.log(`📁 Results saved to: ${OUTPUT_FILE_PATH}`);
  console.log(`📊 Total students processed: ${progressStats.processed}`);
  console.log(`✅ Successful: ${progressStats.successful}`);
  console.log(`❌ Failed: ${progressStats.failed}`);
  console.log("=".repeat(50));
}

// Run the scraper
processStudentData().catch(console.error);
