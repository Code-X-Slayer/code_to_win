import React, { useState, useEffect } from "react";
import { useMeta } from "../../context/MetaContext";
import { useAuth } from "../../context/AuthContext";
import { FaUserPlus, FaTrashAlt } from "react-icons/fa";
import { FiX, FiCheck, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";

const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Edit Modal (student info)
export default function EditModal({
  onClose,
  user, // The student being edited
  onSuccess,
  adminView = false, // True if opened by Admin or HOD
}) {
  const { depts, years } = useMeta();
  const { currentUser } = useAuth();
  const isManager =
    currentUser?.role === "admin" || currentUser?.role === "hod";

  const savedData = {
    name: user.name || "",
    roll: user.student_id || "",
    email: user.email || "",
    year: user.year || "",
    section: user.section || "",
    dept_code: user.dept_code || "",
    degree: user.degree || "",
  };
  const [form, setForm] = useState(savedData);
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [sectionsList, setSectionsList] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    setForm(savedData);
  }, [user]);

  useEffect(() => {
    if (form.dept_code && form.year) {
      const fetchSectionsList = async () => {
        setLoadingSections(true);
        try {
          const res = await fetch(
            `/api/meta/sections?dept=${form.dept_code}&year=${form.year}`
          );
          const data = await res.json();
          setSectionsList(data);
          // If current section is not in new list, clear it (optional, but safer)
          if (data.length > 0 && !data.includes(form.section?.toString())) {
            // setForm(prev => ({ ...prev, section: "" }));
          }
        } catch (err) {
          console.error("Failed to fetch sections", err);
        } finally {
          setLoadingSections(false);
        }
      };
      fetchSectionsList();
    } else {
      setSectionsList([]);
    }
  }, [form.dept_code, form.year]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      if (name === "dept_code" || name === "year") {
        newForm.section = ""; // Clear section if dept or year changes
      }
      return newForm;
    });
  };

  const handleDelete = async () => {
    setStatus({ loading: true, error: null, success: false });
    try {
      const endpoint =
        currentUser.role === "admin"
          ? `/api/delete-user`
          : `/api/hod/students/${user.student_id}?hodDept=${currentUser.dept_code}`;

      const res = await fetch(endpoint, {
        method: currentUser.role === "admin" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body:
          currentUser.role === "admin"
            ? JSON.stringify({ userId: user.student_id, role: "student" })
            : null,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete student");
      }

      toast.success("Student deleted successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    // Build payload with all relevant fields
    const payload = { userId: user.student_id };
    if (form.name !== savedData.name) payload.name = form.name;
    if (form.email !== savedData.email) payload.email = form.email;
    
    // Students can now update their section
    if (form.section != savedData.section) payload.section = form.section;

    if (isManager) {
      if (form.year != savedData.year) payload.year = form.year;
      if (form.degree !== savedData.degree) payload.degree = form.degree;
      if (
        currentUser.role === "admin" &&
        form.dept_code !== savedData.dept_code
      ) {
        payload.dept_code = form.dept_code;
      }
      if (currentUser.role === "hod") {
        payload.hodDept = currentUser.dept_code;
      }
    }

    // If nothing changed, just close
    if (Object.keys(payload).length === 1) {
      onClose();
      return;
    }

    try {
      let endpoint = "/api/student/update-profile";
      if (currentUser.role === "admin") endpoint = "/api/admin/update-student";
      else if (currentUser.role === "hod") endpoint = "/api/hod/update-student";

      const response = await fetch(endpoint, {
        method: isManager ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update student");
      }
      setStatus({ loading: false, error: null, success: true });
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: false });
    }
  };

  const handleCancel = () => {
    setForm(savedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl md:w-full md:max-w-md w-full p-8 relative transform transition-all scale-100"
        data-aos="fade-in"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FaUserPlus size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {isManager ? "Manage Student Profile" : "Edit Personal Information"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-600">
              Full Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
              placeholder="Enter student name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">
                Roll Number
              </label>
              <input
                name="roll"
                value={form.roll}
                disabled
                className="w-full px-4 py-2 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">
                Year
              </label>
              {isManager ? (
                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="year"
                  value={form.year}
                  disabled
                  className="w-full px-4 py-2 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-600">
              Email Address
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
              placeholder="Enter email"
            />
          </div>

          {/* Section field - available for all users */}
          {!isManager && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">
                Section
              </label>
              <select
                name="section"
                value={form.section}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loadingSections || !form.dept_code || !form.year}
              >
                <option value="">
                  {loadingSections ? "Loading..." : "Select Section"}
                </option>
                {sectionsList.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isManager && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">
                  Section
                </label>
                <select
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 disabled:bg-gray-100"
                  disabled={loadingSections || !form.dept_code || !form.year}
                >
                  <option value="">
                    {loadingSections ? "Loading..." : "Select Section"}
                  </option>
                  {sectionsList.map((s) => (
                    <option key={s} value={s}>
                      Section {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">
                  Degree
                </label>
                <input
                  name="degree"
                  value={form.degree}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                  placeholder="B.Tech"
                />
              </div>
            </div>
          )}

          {currentUser?.role === "admin" && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">
                Department
              </label>
              <select
                name="dept_code"
                value={form.dept_code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
              >
                {depts.map((d) => (
                  <option key={d.dept_code} value={d.dept_code}>
                    {d.dept_name} ({d.dept_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-2">
            <div className="flex justify-between items-center gap-3">
              {isManager && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    showDeleteConfirm
                      ? "bg-red-600 text-white"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <FaTrashAlt />{" "}
                  {showDeleteConfirm ? "Cancel Delete" : "Delete Student"}
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                  disabled={status.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                  disabled={status.loading}
                >
                  {status.loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {showDeleteConfirm && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 animate-in slide-in-from-top-2">
                <p className="text-xs text-red-800 font-semibold mb-3">
                  Are you sure? This will permanently remove all data for{" "}
                  {user.student_id}.
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-red-700"
                >
                  Confirm Delete
                </button>
              </div>
            )}
          </div>

          {status.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <FiAlertTriangle /> {status.error}
            </div>
          )}
          {status.success && (
            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
              <FiCheck /> Student updated successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
