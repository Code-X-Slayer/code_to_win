import React, { useState, useEffect, useCallback } from "react";
import { TbUserShare } from "react-icons/tb";
import { FiEdit2, FiSearch } from "react-icons/fi";
import { useMeta } from "../../context/MetaContext";
import { EditModal } from "../Modals";

const StudentTable = ({
  students = [],
  showBranch = true,
  showYear = true,
  showSection = true,
  onProfileClick = () => {},
  adminView = false,
  canEdit = false, // New prop to show edit button for HODs
  onRefresh = () => {}, // Callback to refresh data after edit/delete
}) => {
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dept: "",
    year: "",
    section: "",
    search: "",
  });
  const [editingStudent, setEditingStudent] = useState(null);
  const [sectionsList, setSectionsList] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const { depts, years } = useMeta();

  useEffect(() => {
    if (adminView && filters.dept && filters.year) {
      const fetchSections = async () => {
        setLoadingSections(true);
        try {
          const res = await fetch(
            `/api/meta/sections?dept=${filters.dept}&year=${filters.year}`
          );
          const data = await res.json();
          setSectionsList(data);
        } catch (err) {
          console.error("Failed to fetch sections", err);
        } finally {
          setLoadingSections(false);
        }
      };
      fetchSections();
    } else {
      setSectionsList([]); // Clear sections if dept or year not selected
    }
  }, [adminView, filters.dept, filters.year]);

  const fetchAllStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/students");
      const data = await response.json();
      setAllStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminView) {
      fetchAllStudents();
    }
  }, [adminView, fetchAllStudents]);

  useEffect(() => {
    if (!adminView) {
      setFilteredStudents(students);
    }
  }, [adminView, students]);

  useEffect(() => {
    if (adminView) {
      let filtered = allStudents.filter((student) => {
        return (
          (filters.dept === "" || student.dept_code === filters.dept) &&
          (filters.year === "" || student.year.toString() === filters.year) &&
          (filters.section === "" || student.section === filters.section) &&
          (filters.search === "" ||
            student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            student.student_id
              .toLowerCase()
              .includes(filters.search.toLowerCase()))
        );
      });
      setFilteredStudents(filtered);
    }
  }, [filters, allStudents, adminView]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      // Clear section if dept or year changes
      if (key === "dept" || key === "year") {
        newFilters.section = "";
      }
      return newFilters;
    });
  };

  const displayStudents = adminView ? filteredStudents : students;
  return (
    <>
      {editingStudent && (
        <EditModal
          user={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            if (adminView) fetchAllStudents();
            onRefresh(); // Refresh HOD or other views
            setEditingStudent(null);
          }}
          adminView={adminView || canEdit}
        />
      )}

      {adminView && (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={filters.dept}
              onChange={(e) => handleFilterChange("dept", e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Departments</option>
              {depts.map((dept) => (
                <option key={dept.dept_code} value={dept.dept_code}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange("section", e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              disabled={loadingSections || !filters.dept || !filters.year}
            >
              <option value="">
                {loadingSections ? "Loading..." : "All Sections"}
              </option>
              {!loadingSections &&
                sectionsList.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredStudents.length} students
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : (
        <table className="min-w-full bg-white border rounded-lg overflow-hidden shadow text-xs md:text-base">
          <thead className="bg-gray-100 text-center">
            <tr>
              <th className="py-3 md:px-4 px-1">S.No</th>
              {/* 👈 dynamic column name */}
              <th className="py-3 md:px-4 px-1 text-left">Student</th>
              <th className="py-3 md:px-4 px-1">Roll Number</th>
              {showBranch && (
                <th className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                  Branch
                </th>
              )}
              {showYear && (
                <th className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                  Year
                </th>
              )}
              {showSection && (
                <th className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                  Section
                </th>
              )}
              <th className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                Batch
              </th>
              <th className="py-3 md:px-4 px-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayStudents?.length > 0 ? (
              displayStudents.map((s, i) => (
                <tr
                  key={s.student_id}
                  className="hover:bg-gray-50 text-center"
                  data-aos="fade-left"
                >
                  <td className="py-3 md:px-4  px-1">{i + 1}</td>
                  <td className="py-3 md:px-4  px-1 text-left flex items-center gap-2">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 hidden md:flex items-center text-sm justify-center font-bold">
                      {s.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    {s.name}
                  </td>
                  <td className="py-3 px-4">{s.student_id}</td>
                  {showBranch && (
                    <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                      {s.dept_name}
                    </td>
                  )}
                  {showYear && (
                    <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                      {s.year}
                    </td>
                  )}
                  {showSection && (
                    <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                      {s.section}
                    </td>
                  )}
                  <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                    {s.batch || "N/A"}
                  </td>
                  <td className="py-3 md:px-4 px-1">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onProfileClick(s)}
                        className="text-gray-700 px-2 py-1 rounded hover:text-blue-700 flex items-center gap-1"
                        title="View Profile"
                      >
                        <TbUserShare />
                      </button>
                      {(adminView || canEdit) && (
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="text-gray-700 px-2 py-1 rounded hover:text-green-700 flex items-center gap-1"
                          title="Edit Student"
                        >
                          <FiEdit2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-3 px-4 text-center">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </>
  );
};
export default StudentTable;
