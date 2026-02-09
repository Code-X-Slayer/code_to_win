import React, { useEffect, useState, lazy, Suspense, useMemo, useCallback } from "react";
const ViewProfile = lazy(() => import("./ViewProfile"));
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import { formatName, formatDepartment, formatSection } from "../utils/textFormatter";

const RankBadge = ({ rank }) => {
  if (rank === 1)
    return <span className="text-white px-2 py-1 rounded-full">🥇</span>;
  if (rank === 2)
    return <span className="text-white px-2 py-1 rounded-full">🥈</span>;
  if (rank === 3)
    return <span className="text-white px-2 py-1 rounded-full">🥉</span>;
  return <span>{rank}</span>;
};

const SectionLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentRank, setStudentRank] = useState(null);
  const [sectionInfo, setSectionInfo] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { currentUser } = useAuth();

  const fetchSectionLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/ranking/section?studentId=${currentUser?.student_id}`
      );

      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Student profile not found");
        } else {
          throw new Error("Failed to fetch section leaderboard");
        }
        return;
      }

      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setStudentRank(data.studentRank || null);
      setSectionInfo(data.sectionInfo || null);

      if (data.leaderboard && data.leaderboard.length === 0) {
        toast.info(data.message || "No leaderboard data available for your section");
      }
    } catch (err) {
      console.error("Error fetching section leaderboard:", err);
      toast.error("Failed to load section leaderboard");
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.student_id]);

  useEffect(() => {
    fetchSectionLeaderboard();
  }, [fetchSectionLeaderboard]);

  // Pagination logic
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);
  const paginatedRanks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return leaderboard.slice(startIndex, startIndex + itemsPerPage);
  }, [leaderboard, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="w-full p-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Section Leaderboard</h2>
          {sectionInfo && (
            <p className="text-gray-600 mb-4">
              {formatDepartment(sectionInfo.dept_name)} • Year {sectionInfo.year} • Section {formatSection(sectionInfo.section)}
            </p>
          )}
          <p className="text-gray-500 text-lg">
            📊 Leaderboard data not available for your section yet.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Check back soon as more students join the platform!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Section Leaderboard</h1>
        {sectionInfo && (
          <p className="text-gray-600">
            {formatDepartment(sectionInfo.dept_name)} • Year {sectionInfo.year}
            {sectionInfo.section ? ` • Section ${formatSection(sectionInfo.section)}` : ""}
          </p>
        )}
      </div>

      {/* Student's Current Rank Card */}
      {studentRank && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-purple-600">
                <RankBadge rank={studentRank.rank} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Current Rank</p>
                <p className="text-lg font-semibold text-gray-800">{studentRank.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Score</p>
              <p className="text-3xl font-bold text-purple-600">{studentRank.score}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Student ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  <span title="Problems Solved">Solved</span>
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  <span title="Contests Participated">Contests</span>
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">
                  <span title="Total Score">Score</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRanks.map((student) => {
                // Use combined totals from backend for consistency
                const totalSolved = student.combined?.totalSolved || 
                  ((student.performance?.platformWise?.leetcode?.easy || 0) +
                  (student.performance?.platformWise?.leetcode?.medium || 0) +
                  (student.performance?.platformWise?.leetcode?.hard || 0) +
                  (student.performance?.platformWise?.gfg?.school || 0) +
                  (student.performance?.platformWise?.gfg?.basic || 0) +
                  (student.performance?.platformWise?.gfg?.easy || 0) +
                  (student.performance?.platformWise?.gfg?.medium || 0) +
                  (student.performance?.platformWise?.gfg?.hard || 0) +
                  (student.performance?.platformWise?.codechef?.problems || 0));

                const totalContests = student.combined?.totalContests ||
                  ((student.performance?.platformWise?.leetcode?.contests || 0) +
                  (student.performance?.platformWise?.codechef?.contests || 0) +
                  (student.performance?.platformWise?.gfg?.contests || 0));

                const isCurrentUser =
                  student.student_id === currentUser?.student_id;
                const rowClass = isCurrentUser
                  ? "bg-purple-50 border-l-4 border-purple-400"
                  : "border-b border-gray-200 hover:bg-gray-50 transition-colors";

                return (
                  <tr key={student.student_id} className={rowClass}>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      <RankBadge rank={student.rank} />
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatName(student.name)}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 font-medium">
                      {totalSolved !== null && totalSolved !== undefined ? totalSolved : "—"}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 font-medium">
                      {totalContests !== null && totalContests !== undefined ? totalContests : "—"}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-lg text-blue-600">
                      {student.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <FaChevronLeft size={16} />
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <FaChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Student Profile Modal */}
      {selectedStudent && (
        <Suspense fallback={<LoadingSpinner />}>
          <ViewProfile
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        </Suspense>
      )}

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-600">
          📊 Showing {paginatedRanks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, leaderboard.length)} of{" "}
          {leaderboard.length} students in your section
        </p>
      </div>
    </div>
  );
};

export default SectionLeaderboard;
