import React, { useState } from "react";
import { FiDownload, FiFileText, FiAlertCircle } from "react-icons/fi";
import { useMeta } from "../../context/MetaContext";
import toast from "react-hot-toast";

const CodingPointsReport = ({ user }) => {
  const { depts, years } = useMeta();
  const [loading, setLoading] = useState(false);
  const [sectionsList, setSectionsList] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [filters, setFilters] = useState({
    dept: user.role === "hod" || user.role === "faculty" ? user.dept_code : "",
    year: "",
    section: "",
  });

  React.useEffect(() => {
    // Reset section when dept or year changes
    setFilters((f) => ({ ...f, section: "" }));

    if (filters.dept && filters.year) {
      const fetchSections = async () => {
        setLoadingSections(true);
        try {
          const res = await fetch(
            `/api/meta/sections?dept=${filters.dept}&year=${filters.year}`
          );
          let data = await res.json();

          // If Faculty, limit to their actual assignments
          if (user.role === "faculty" && user.assignments) {
            const assignedSections = user.assignments
              .filter((a) => a.year == filters.year)
              .map((a) => a.section.toString());
            data = data.filter((s) => assignedSections.includes(s.toString()));
          }

          setSectionsList(data);
        } catch (err) {
          console.error("Failed to fetch sections", err);
        } finally {
          setLoadingSections(false);
        }
      };
      fetchSections();
    } else {
      setSectionsList([]);
    }
  }, [filters.dept, filters.year, user.role, user.assignments]);

  const handleDownload = async () => {
    if (!filters.dept || !filters.year || !filters.section) {
      toast.error("Please select Department, Year, and Section");
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        userId: user.user_id,
      }).toString();

      const response = await fetch(`/api/reports/coding-points?${queryParams}`);
      if (!response.ok) throw new Error("Failed to generate report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Coding_Points_${filters.dept}_${filters.year}_${filters.section}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <FiFileText size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Coding Points Calculation Report
          </h2>
          <p className="text-gray-500 text-sm">
            Download specialized section-wise student coding performance sheets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Department Select */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">
            Department
          </label>
          <select
            value={filters.dept}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dept: e.target.value }))
            }
            disabled={user.role === "hod" || user.role === "faculty"}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50"
          >
            <option value="">Select Department</option>
            {depts.map((d) => (
              <option key={d.dept_code} value={d.dept_code}>
                {d.dept_name}
              </option>
            ))}
          </select>
        </div>

        {/* Year Select */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">Year</label>
          <select
            value={filters.year}
            onChange={(e) =>
              setFilters((f) => ({ ...f, year: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
          >
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y} Year
              </option>
            ))}
          </select>
        </div>

        {/* Section Select */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">Section</label>
          <select
            value={filters.section}
            onChange={(e) =>
              setFilters((f) => ({ ...f, section: e.target.value }))
            }
            disabled={loadingSections || !filters.year}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
          >
            <option value="">
              {loadingSections ? "Loading sections..." : "Select Section"}
            </option>
            {sectionsList.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3 mb-8">
        <FiAlertCircle className="text-amber-500 mt-1 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          This report follows the official university "Coding Points
          Calculation" template. It aggregates data from HackerRank, LeetCode,
          CodeChef, and GeeksForGeeks.
        </p>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Generating...
          </div>
        ) : (
          <>
            <FiDownload />
            Download Excel Report
          </>
        )}
      </button>
    </div>
  );
};

export default CodingPointsReport;
