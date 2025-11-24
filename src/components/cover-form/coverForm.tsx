"use client";

import React, { useState } from "react";
import { Upload, FileUp, RotateCcw } from "lucide-react";
import type { CoverFormValues } from "@/components/cover-form/typs";

type CoverFormProps = {
  onGenerate: (data: CoverFormValues) => void;
};

const CoverForm: React.FC<CoverFormProps> = ({ onGenerate }) => {
  const [isOther, setIsOther] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetClicked, setResetClicked] = useState(false);

  // 🔒 ব্লকড কিনা চেক করার helper (কিন্তু UI তে কিছু দেখাবে না)
  const isStudentBlocked = async (studentId: string): Promise<boolean> => {
    if (!studentId.trim()) return false;

    try {
      const res = await fetch(
        `/api/blocked-students?studentId=${encodeURIComponent(
          studentId.trim()
        )}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        // API তে সমস্যা হলে normal behave করব
        return false;
      }

      const json = await res.json();
      return (json.total || 0) > 0;
    } catch (err) {
      console.error("Blocked API fetch error:", err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const logoFile = formData.get("logo") as File | null;
      const coverTitleRaw = (formData.get("cover_title") as string) || "";
      const courseNameRaw = (formData.get("course_name") as string) || "";
      const courseCode = (formData.get("course_code") as string) || "";
      const studentName = (formData.get("student_name") as string) || "";
      const studentID = (formData.get("student_id") as string) || "";
      const submissionDate = (formData.get("submission_date") as string) || "";
      const sectionBatch = (formData.get("section_batch") as string) || "";
      const batch = (formData.get("batch") as string) || "";

      const teacherNameRaw = (formData.get("teacher_name") as string) || "";
      const teacherPosition =
        (formData.get("teacher_position") as string) || "";
      const universityName =
        (formData.get("university_name") as string) || "";

      // Department logic
      let department = (formData.get("department") as string) || "";
      if (department === "OTHER") {
        const custom = (formData.get("department_custom") as string) || "";
        department = custom;
      }

      // ✅ Validation: Required fields (silent - no alert, no console.error)
      if (!studentName.trim() || !studentID.trim() || !courseNameRaw.trim()) {
        // just stop submit silently
        return;
      }

      // 🔒 এখানে চুপচাপ check করব – user কিছুই বুঝবে না
      const blocked = await isStudentBlocked(studentID);

      // 🔒 ব্লকড হলে কোন কোন ফিল্ড preview এ যাবে না
      let coverTitle = coverTitleRaw;
      let courseName = courseNameRaw;
      let teacherName = teacherNameRaw;
      let courseCodeSafe = courseCode;
      let submissionDateSafe = submissionDate;

      if (blocked) {
        // ✅ ব্লকড হলে – কিছু ফিল্ড preview এ যাবে না
        coverTitle = "";
        courseName = "";
        teacherName = "";
        courseCodeSafe = "";
        submissionDateSafe = "";
      }

      let logoUrl: string | null = null;
      if (logoFile && logoFile.size > 0) {
        logoUrl = URL.createObjectURL(logoFile);
      }

      const data: CoverFormValues = {
        logoFile,
        logoUrl,
        coverTitle, // 🔒 modified value (blocked হলে empty)
        courseName, // 🔒 modified
        courseCode: courseCodeSafe, // 🔒 safe value
        studentName,
        studentID,
        submissionDate: submissionDateSafe, // 🔒 safe value
        sectionBatch,
        teacherName, // 🔒 modified
        teacherPosition,
        department,
        universityName,
        batch,
      };

      // 👉 Preview system এ পাঠাচ্ছি (user বুঝবে না ব্লক কেসে কী হল)
      onGenerate(data);

      // ✅ Date Format: DD/MM/YYYY (DB er jonno)
      let formattedDate = "";
      if (submissionDate) {
        const parts = submissionDate.split("-");
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      if (!formattedDate) {
        const now = new Date();
        formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(
          now.getMonth() + 1
        ).padStart(2, "0")}/${now.getFullYear()}`;
      }

      // ✅ Save to API (Blocked হলেও database এ info থাকবে)
      await saveStudentToAPI({
        studentId: studentID,
        studentName: studentName,
        section: sectionBatch,
        batch: batch,
        department: department,
        // এখানে original courseName save করছ, future check এর জন্য
        courseName: courseNameRaw,
        teacherName: teacherNameRaw,
        createDate: formattedDate,
      });
    } catch (error) {
      console.error("❌ handleSubmit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveStudentToAPI = async (studentData: Record<string, string>) => {
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Student saved:", result);
      } else {
        const error = await response.json();
        console.error("❌ Error saving student:", error);
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
    }
  };

  const handleReset = () => {
    const form = document.querySelector("form") as HTMLFormElement | null;
    if (form) form.reset();

    setIsOther(false);
    setLoading(false);

    // ✅ Reset feedback
    setResetClicked(true);
    setTimeout(() => {
      setResetClicked(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen px-4">
      <div className="mx-auto">
        <div className="bg-[#f8f9fa] backdrop-blur-sm rounded-[2px] border border-zinc-200">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            {/* Logo Upload */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">
                Institute / University Logo
              </h3>
              <p className="text-xs text-zinc-500">Optional.</p>

              <label className="py-4 group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center transition hover:border-zinc-600 hover:bg-zinc-100 cursor-pointer">
                <Upload className="mb-3 h-10 w-10 text-zinc-600 group-hover:scale-105 transition-transform" />
                <p className="text-sm font-semibold text-zinc-800">
                  Upload Logo
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Drag & drop or click to browse • PNG / JPG up to 10MB
                </p>

                <span className="mt-4 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition group-hover:bg-black">
                  Choose File
                </span>

                <input
                  type="file"
                  name="logo"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  aria-label="Upload logo"
                />
              </label>
            </section>

            {/* University Name */}
            <section className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-800">
                University Name
              </label>

              <input
                type="text"
                name="university_name"
                placeholder="Presidency University of Bangladesh"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
              />

              <p className="text-xs text-zinc-500">
                This will appear as the main heading on your cover page.
              </p>
            </section>

            {/* Cover Title */}
            <section className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-800">
                Cover Title
              </label>

              <input
                type="text"
                name="cover_title"
                placeholder="e.g., Final Project Report"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
              />
            </section>

            {/* Course Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">
                Course Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Course Name
                  </label>

                  <input
                    type="text"
                    name="course_name"
                    placeholder="e.g., Web Development"
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Course Code
                  </label>

                  <input
                    type="text"
                    name="course_code"
                    placeholder="e.g., CSE-101"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  />
                </div>
              </div>
            </section>

            {/* Student Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">
                Student Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Student Name
                  </label>

                  <input
                    type="text"
                    name="student_name"
                    placeholder="Your full name"
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Student ID / Roll
                  </label>

                  <input
                    type="text"
                    name="student_id"
                    placeholder="Your student ID"
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  />
                </div>
              </div>
            </section>

            {/* Submission Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">
                Class & Submission
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Submission Date
                  </label>

                  <input
                    type="date"
                    name="submission_date"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Section
                  </label>

                  <input
                    type="text"
                    name="section_batch"
                    placeholder="e.g., Section A"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Batch
                  </label>

                  <input
                    type="text"
                    name="batch"
                    placeholder="e.g., 23rd Batch"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  />
                </div>
              </div>
            </section>

            {/* Teacher Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">
                Teacher / Instructor
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Teacher Name
                  </label>

                  <input
                    type="text"
                    name="teacher_name"
                    placeholder="Instructor name"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Teacher Position
                  </label>

                  <input
                    type="text"
                    name="teacher_position"
                    placeholder="e.g., Lecturer"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  />
                </div>
              </div>
            </section>

            {/* Department */}
            <section className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-800">
                Department
              </label>

              <select
                name="department"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900"
                defaultValue=""
                onChange={(e) => setIsOther(e.target.value === "OTHER")}
              >
                <option value="" disabled>
                  — Select Department —
                </option>

                <option value="Department of Computer Science & Engineering">
                  Computer Science & Engineering (CSE)
                </option>

                <option value="Department of Civil Engineering">
                  Civil Engineering (CE)
                </option>

                <option value="Department of Electrical & Electronic Engineering">
                  Electrical & Electronic Engineering (EEE)
                </option>

                <option value="Department of Electrical & Telecommunication Engineering">
                  Electrical & Telecommunication Engineering (ETE)
                </option>

                <option value="Department of Business Administration">
                  Business Administration
                </option>

                <option value="Department of English">English</option>

                <option value="Department of Law">Law</option>

                <option value="Department of Economics">Economics</option>

                <option value="OTHER">Other (Write your own)</option>
              </select>

              {isOther && (
                <input
                  type="text"
                  name="department_custom"
                  placeholder="Enter your department"
                  className="w-full mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900"
                />
              )}
            </section>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-200 mt-2 md:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
                    />
                  </svg>
                ) : (
                  <FileUp className="h-5 w-5" />
                )}

                {loading ? "Generating..." : "Generate Cover Page"}
              </button>

              <button
                type="reset"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition"
              >
                <RotateCcw className="h-4 w-4" />
                {resetClicked ? "Reset Done" : "Reset"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoverForm;
