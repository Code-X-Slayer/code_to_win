import React, { useState, useEffect } from "react";
import { useMeta } from "../../context/MetaContext";
import toast from "react-hot-toast";
import {
  FiFilter,
  FiDownload,
  FiSearch,
  FiX,
  FiUsers,
  FiCheckCircle,
} from "react-icons/fi";

const PlacementEligibilityFilter = () => {
  const { depts, years } = useMeta();

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [leetcodeMin, setLeetcodeMin] = useState("");
  const [geeksforgeeksMin, setGeeksforgeeksMin] = useState("");
  const [hackerrankMin, setHackerrankMin] = useState("");
  const [codechefMin, setCodechefMin] = useState("");
  const [githubMin, setGithubMin] = useState("");

  // Results state
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Handle branch selection
  const toggleBranch = (branchCode) => {
    setSelectedBranches((prev) =>
      prev.includes(branchCode)
        ? prev.filter((b) => b !== branchCode)
        : [...prev, branchCode]
    );
  };

  // Handle year selection
  const toggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Select all branches
  const selectAllBranches = () => {
    if (selectedBranches.length === depts.length) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches(depts.map((d) => d.dept_code));
    }
  };

  // Select all years
  const selectAllYears = () => {
    if (selectedYears.length === years.length) {
      setSelectedYears([]);
    } else {
      setSelectedYears(years);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!companyName.trim()) {
      toast.error("Please enter company name");
      return;
    }

    if (selectedBranches.length === 0) {
      toast.error("Please select at least one branch");
      return;
    }

    if (selectedYears.length === 0) {
      toast.error("Please select at least one year");
      return;
    }

    setLoading(true);
    setShowResults(false);

    try {
      const requestBody = {
        companyName: companyName.trim(),
        branches: selectedBranches,
        years: selectedYears,
      };

      // Add optional platform filters
      if (leetcodeMin) requestBody.leetcodeMin = parseInt(leetcodeMin);
      if (geeksforgeeksMin)
        requestBody.geeksforgeeksMin = parseInt(geeksforgeeksMin);
      if (hackerrankMin) requestBody.hackerrankMin = parseInt(hackerrankMin);
      if (codechefMin) requestBody.codechefMin = parseInt(codechefMin);
      if (githubMin) requestBody.githubMin = parseInt(githubMin);

      const response = await fetch("/api/admin/placement-eligibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch eligible students");
      }

      const data = await response.json();
      setEligibleStudents(data.eligibleStudents);
      setFilters(data.filters);
      setShowResults(true);
      toast.success(
        `Found ${data.totalEligible} eligible student${
          data.totalEligible !== 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error("Error fetching eligible students:", error);
      toast.error("Failed to fetch eligible students");
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel export
  const handleExport = async () => {
    if (eligibleStudents.length === 0) {
      toast.error("No eligible students to export");
      return;
    }

    setExportLoading(true);

    try {
      const response = await fetch("/api/export/placement-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          filters,
          eligibleStudents,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate Excel file");
      }

      // Get the filename from headers
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Placement_Eligibility.xlsx`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    } finally {
      setExportLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setCompanyName("");
    setSelectedBranches([]);
    setSelectedYears([]);
    setLeetcodeMin("");
    setGeeksforgeeksMin("");
    setHackerrankMin("");
    setCodechefMin("");
    setGithubMin("");
    setEligibleStudents([]);
    setFilters(null);
    setShowResults(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiUsers className="text-3xl text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Placement Eligibility Filter
            </h2>
            <p className="text-gray-600">
              Shortlist students based on company-specific criteria
            </p>
          </div>
        </div>
      </div>

      {/* Filter Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Branch Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Select Branches <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={selectAllBranches}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedBranches.length === depts.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {depts.map((dept) => (
                <label
                  key={dept.dept_code}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(dept.dept_code)}
                    onChange={() => toggleBranch(dept.dept_code)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {dept.dept_name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Year Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Select Years <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={selectAllYears}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedYears.length === years.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {years.filter((year) => year !== null && year !== undefined && year !== '').map((year) => (
                <label
                  key={year}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => toggleYear(year)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {year === 1 || year === '1' ? '1st Year' :
                     year === 2 || year === '2' ? '2nd Year' :
                     year === 3 || year === '3' ? '3rd Year' :
                     year === 4 || year === '4' ? '4th Year' :
                     `Year ${year}`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Platform Score Filters */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Coding Platform Minimum Scores{" "}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* LeetCode */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  LeetCode (Total Problems)
                </label>
                <input
                  type="number"
                  min="0"
                  value={leetcodeMin}
                  onChange={(e) => setLeetcodeMin(e.target.value)}
                  placeholder="e.g., 50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* GeeksforGeeks */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  GeeksforGeeks (Total Problems)
                </label>
                <input
                  type="number"
                  min="0"
                  value={geeksforgeeksMin}
                  onChange={(e) => setGeeksforgeeksMin(e.target.value)}
                  placeholder="e.g., 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* HackerRank */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  HackerRank (Badges)
                </label>
                <input
                  type="number"
                  min="0"
                  value={hackerrankMin}
                  onChange={(e) => setHackerrankMin(e.target.value)}
                  placeholder="e.g., 3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* CodeChef */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  CodeChef (Total Problems)
                </label>
                <input
                  type="number"
                  min="0"
                  value={codechefMin}
                  onChange={(e) => setCodechefMin(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* GitHub */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  GitHub (Repos + Contributions)
                </label>
                <input
                  type="number"
                  min="0"
                  value={githubMin}
                  onChange={(e) => setGithubMin(e.target.value)}
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              <FiSearch />
              {loading ? "Filtering..." : "Find Eligible Students"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
            >
              <FiX />
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {showResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-2xl text-green-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Eligible Students for {companyName}
                </h3>
                <p className="text-sm text-gray-600">
                  {eligibleStudents.length} student
                  {eligibleStudents.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading || eligibleStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              <FiDownload />
              {exportLoading ? "Exporting..." : "Export to Excel"}
            </button>
          </div>

          {/* Applied Filters Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Applied Filters:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-blue-800">Branches:</span>{" "}
                <span className="text-blue-700">
                  {selectedBranches.join(", ")}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Years:</span>{" "}
                <span className="text-blue-700">
                  {selectedYears.join(", ")}
                </span>
              </div>
              {leetcodeMin && (
                <div>
                  <span className="font-medium text-blue-800">
                    LeetCode Min:
                  </span>{" "}
                  <span className="text-blue-700">{leetcodeMin}</span>
                </div>
              )}
              {geeksforgeeksMin && (
                <div>
                  <span className="font-medium text-blue-800">GFG Min:</span>{" "}
                  <span className="text-blue-700">{geeksforgeeksMin}</span>
                </div>
              )}
              {hackerrankMin && (
                <div>
                  <span className="font-medium text-blue-800">HR Min:</span>{" "}
                  <span className="text-blue-700">{hackerrankMin}</span>
                </div>
              )}
              {codechefMin && (
                <div>
                  <span className="font-medium text-blue-800">CC Min:</span>{" "}
                  <span className="text-blue-700">{codechefMin}</span>
                </div>
              )}
              {githubMin && (
                <div>
                  <span className="font-medium text-blue-800">GitHub Min:</span>{" "}
                  <span className="text-blue-700">{githubMin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Students Table */}
          {eligibleStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LeetCode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GFG
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CodeChef
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HackerRank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GitHub
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eligibleStudents.map((student, index) => (
                    <tr
                      key={student.student_id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {student.dept_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {student.year}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">
                          {student.leetcode_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">
                          {student.geeksforgeeks_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">
                          {student.codechef_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">
                          {student.hackerrank_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">
                          {student.github_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No students match the specified criteria
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlacementEligibilityFilter;
