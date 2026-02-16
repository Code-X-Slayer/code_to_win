import React, { useState } from "react";
import { useMeta } from "../../context/MetaContext";
import { FaUserPlus } from "react-icons/fa6";
import GenericFormModal from "./GenericFormModal";

// Add Deputy HOD Modal
export default function AddDeputyHODModal(props) {
  const { depts } = useMeta();
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const handleSubmit = async (form, setForm) => {
    setStatus({ loading: true, error: null, success: null });
    if (!form.name || !form.deputyHodId || !form.email || !form.dept) {
      setStatus({
        loading: false,
        error: "Please fill all required fields",
        success: null,
      });
      return;
    }
    try {
      const response = await fetch(`/api/add-deputy-hod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add Deputy HOD");
      setStatus({
        loading: false,
        error: null,
        success: "Deputy HOD added successfully!",
      });
      setForm({
        name: "",
        deputyHodId: "",
        email: "",
        dept: "",
      });
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: null });
    }
  };

  return (
    <GenericFormModal
      {...props}
      title="Add New Deputy HOD"
      icon={<FaUserPlus className="w-4 h-4" />}
      fields={[
        { name: "name", label: "Deputy HOD Name", type: "text", required: true },
        { name: "deputyHodId", label: "Employee ID", type: "text", required: true },
        { name: "email", label: "Official Email ID", type: "email", required: true },
        {
          name: "dept",
          label: "Department",
          type: "select",
          required: true,
          options:
            depts?.map((dept) => ({
              value: dept.dept_code,
              label: dept.dept_name,
            })) || [],
        },
      ]}
      onSubmit={handleSubmit}
      loading={status.loading}
      error={status.error}
      success={status.success}
      initialValues={{
        name: "",
        deputyHodId: "",
        email: "",
        dept: "",
      }}
    />
  );
}
