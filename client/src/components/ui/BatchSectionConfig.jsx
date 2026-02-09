import React, { useState, useEffect } from "react";
import { useMeta } from "../../context/MetaContext";
import toast from "react-hot-toast";
import { FiSave, FiRefreshCw } from "react-icons/fi";

const BatchSectionConfig = () => {
  const { depts } = useMeta();
  const [configs, setConfigs] = useState([]);
  const [localConfigs, setLocalConfigs] = useState({}); // { "DEPT_CODE-BATCH": num }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Current year to generate relevant batches (e.g., last 4 years)
  const currentYear = new Date().getFullYear();
  const relevantBatches = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
  ];

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/batch-configs");
      const data = await res.json();
      setConfigs(data);

      // Initialize local configs
      const local = {};
      data.forEach((c) => {
        local[`${c.dept_code}-${c.batch}`] = c.num_sections;
      });
      setLocalConfigs(local);
    } catch (err) {
      console.error("Failed to load batch configurations", err);
      toast.error("Failed to load batch configurations");
    }
    setLoading(false);
  };

  const handleLocalChange = (dept_code, batch, value) => {
    const val = parseInt(value) || 0;
    setLocalConfigs((prev) => ({
      ...prev,
      [`${dept_code}-${batch}`]: val,
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Find what shifted from original configs
      const updates = [];
      depts.forEach((dept) => {
        relevantBatches.forEach((batch) => {
          const key = `${dept.dept_code}-${batch}`;
          const currentVal = localConfigs[key] || 0;
          const originalVal =
            configs.find(
              (c) => c.dept_code === dept.dept_code && c.batch === batch
            )?.num_sections || 0;

          if (currentVal !== originalVal) {
            updates.push({
              dept_code: dept.dept_code,
              batch,
              num_sections: currentVal,
            });
          }
        });
      });

      if (updates.length === 0) {
        toast.error("No changes to save");
        setSaving(false);
        return;
      }

      await Promise.all(
        updates.map((u) =>
          fetch("/api/admin/batch-configs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(u),
          })
        )
      );

      toast.success("All changes saved successfully");
      fetchConfigs();
    } catch (err) {
      console.error("Error saving configurations", err);
      toast.error("Error saving configurations");
    }
    setSaving(false);
  };

  const getConfigVal = (dept_code, batch) => {
    return localConfigs[`${dept_code}-${batch}`] || 0;
  };

  if (loading)
    return <div className="text-center py-10">Loading configurations...</div>;

  const hasChanges = () => {
    return depts.some((dept) =>
      relevantBatches.some((batch) => {
        const key = `${dept.dept_code}-${batch}`;
        const currentVal = localConfigs[key] || 0;
        const originalVal =
          configs.find(
            (c) => c.dept_code === dept.dept_code && c.batch === batch
          )?.num_sections || 0;
        return currentVal !== originalVal;
      })
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Batch & Section Configuration
          </h2>
          <p className="text-gray-500 text-sm">
            Define how many sections each year contains for every department.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchConfigs}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors border rounded-lg"
            title="Refresh"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving || !hasChanges()}
            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all w-full md:w-auto ${
              hasChanges()
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FiSave />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Department</th>
              {relevantBatches.map((batch) => (
                <th
                  key={batch}
                  className="p-4 font-semibold text-gray-600 text-center whitespace-nowrap"
                >
                  Batch {batch} <br />
                  <span className="text-xs font-normal text-gray-400">
                    (Year {currentYear - batch + 1})
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {depts.map((dept) => (
              <tr
                key={dept.dept_code}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="p-4 font-medium text-gray-700">
                  {dept.dept_name} <br />
                  <span className="text-xs text-gray-400">
                    {dept.dept_code}
                  </span>
                </td>
                {relevantBatches.map((batch) => (
                  <td key={batch} className="p-4">
                    <div className="flex flex-col items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="26"
                        value={getConfigVal(dept.dept_code, batch)}
                        onChange={(e) =>
                          handleLocalChange(
                            dept.dept_code,
                            batch,
                            e.target.value
                          )
                        }
                        className={`w-20 p-2 text-center border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                          getConfigVal(dept.dept_code, batch) !==
                          (configs.find(
                            (c) =>
                              c.dept_code === dept.dept_code &&
                              c.batch === batch
                          )?.num_sections || 0)
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      />
                      <span className="text-[10px] text-gray-400">
                        Sections
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">
        <p>
          <strong className="flex items-center gap-1">
            <FiSave /> Note:
          </strong>
          Changes are <strong>not</strong> saved automatically. Adjust the
          section counts (1, 2, 3...) and click the{" "}
          <strong>Save Changes</strong> button above to apply.
        </p>
      </div>
    </div>
  );
};

export default BatchSectionConfig;