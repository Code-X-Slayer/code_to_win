const mysql = require("mysql2/promise");
require("dotenv").config();

async function runMigration() {
  console.log("🔧 Running Deputy HOD Migration...\n");

  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log("✅ Connected to database:", process.env.DB_NAME);

    // Check if column already exists
    const [columns] = await connection.query(
      `SELECT COUNT(*) AS column_exists
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
         AND TABLE_NAME = 'hod_profiles'
         AND COLUMN_NAME = 'is_deputy_hod'`,
      [process.env.DB_NAME]
    );

    if (columns[0].column_exists > 0) {
      console.log("ℹ️  Column 'is_deputy_hod' already exists. Migration skipped.");
      return;
    }

    console.log("📝 Adding 'is_deputy_hod' column to hod_profiles table...");

    // Add the column
    await connection.query(
      `ALTER TABLE hod_profiles 
       ADD COLUMN is_deputy_hod BOOLEAN DEFAULT FALSE AFTER dept_code`
    );

    console.log("✅ Column added successfully!");

    // Update existing rows
    console.log("📝 Updating existing HOD records...");
    await connection.query(
      `UPDATE hod_profiles 
       SET is_deputy_hod = FALSE 
       WHERE is_deputy_hod IS NULL`
    );

    console.log("✅ Migration completed successfully!\n");
    console.log("🚀 You can now add Deputy HODs through the Admin Dashboard.");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n✅ Database connection closed.");
    }
  }
}

runMigration();
