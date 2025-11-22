"use client"

import type React from "react"
import { Upload, FileUp, RotateCcw } from "lucide-react"
import type { CoverFormValues } from "@/components/cover-form/typs"

type CoverFormProps = {
  onGenerate: (data: CoverFormValues) => void
}

const CoverForm: React.FC<CoverFormProps> = ({ onGenerate }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    const logoFile = formData.get("logo") as File | null
    const coverTitle = (formData.get("cover_title") as string) || ""
    const courseName = (formData.get("course_name") as string) || ""
    const courseCode = (formData.get("course_code") as string) || ""
    const studentName = (formData.get("student_name") as string) || ""
    const studentID = (formData.get("student_id") as string) || ""
    const submissionDate = (formData.get("submission_date") as string) || ""
    const sectionBatch = (formData.get("section_batch") as string) || ""
    const teacherName = (formData.get("teacher_name") as string) || ""
    const teacherPosition = (formData.get("teacher_position") as string) || ""
    const department = (formData.get("department") as string) || ""
    const universityName = (formData.get("university_name") as string) || ""

    // Create preview URL from file
    let logoUrl: string | null = null
    if (logoFile && logoFile.size > 0) {
      logoUrl = URL.createObjectURL(logoFile)
    }

    const data: CoverFormValues = {
      logoFile,
      logoUrl,
      coverTitle,
      courseName,
      courseCode,
      studentName,
      studentID,
      submissionDate,
      sectionBatch,
      teacherName,
      teacherPosition,
      department,
      universityName,
    }

    onGenerate(data)
  }

  const handleReset = () => {
    const form = document.querySelector("form") as HTMLFormElement
    if (form) form.reset()
  }

  return (
    <div className="min-h-screen px-4">
      <div className="mx-auto">
        <div className="bg-[#f8f9fa] backdrop-blur-sm rounded-[2px] border border-zinc-200">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            {/* Logo Upload Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">Institute / University Logo</h3>
              <p className="text-xs text-zinc-500">Optional.</p>

              <label className="py-4 group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center transition hover:border-zinc-600 hover:bg-zinc-100 cursor-pointer">
                <Upload className="mb-3 h-10 w-10 text-zinc-600 group-hover:scale-105 transition-transform" />
                <p className="text-sm font-semibold text-zinc-800">Upload Logo</p>
                <p className="mt-1 text-xs text-zinc-500">Drag & drop or click to browse • PNG / JPG up to 10MB</p>
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

            {/* University name  */}
            <section className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-800">University Name</label>
              <input
                type="text"
                name="university_name"
                placeholder="Presidency University of Bangladesh"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
              />
              <p className="text-xs text-zinc-500">This will appear as the main heading on your cover page.</p>
            </section>
            {/* Cover Title */}
            <section className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-800">Cover Title</label>
              <input
                type="text"
                name="cover_title"
                placeholder="e.g., Final Project Report on Web Application Development"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
              />
              <p className="text-xs text-zinc-500">This will appear as the main heading on your cover page.</p>
            </section>

            {/* Course Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">Course Information</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Course Name</label>
                  <input
                    type="text"
                    name="course_name"
                    placeholder="e.g., Introduction to Web Development"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Course Code</label>
                  <input
                    type="text"
                    name="course_code"
                    placeholder="e.g., CSE-101"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>
              </div>
            </section>

            {/* Student Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">Student Information</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Student Name</label>
                  <input
                    type="text"
                    name="student_name"
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Student ID / Roll</label>
                  <input
                    type="text"
                    name="student_id"
                    placeholder="Your student ID or roll number"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>
              </div>
            </section>

            {/* Submission & Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">Class & Submission</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Submission Date</label>
                  <input
                    type="date"
                    name="submission_date"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    If you don&apos;t want the date on the cover, you can skip this.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Section / Batch</label>
                  <input
                    type="text"
                    name="section_batch"
                    placeholder="e.g., Section A, Batch 23"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>
              </div>
            </section>

            {/* Teacher Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">Teacher / Instructor</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Teacher Name</label>
                  <input
                    type="text"
                    name="teacher_name"
                    placeholder="Instructor&apos;s full name"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Teacher Position</label>
                  <input
                    type="text"
                    name="teacher_position"
                    placeholder="e.g., Lecturer, Assistant Professor"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>
              </div>
            </section>

            {/* Department */}
            <section className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-800">Department / Institute</label>
              <input
                type="text"
                name="department"
                placeholder="e.g., Department of Computer Science & Engineering"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
              />
            </section>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-200 mt-2 md:flex-row">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1"
              >
                <FileUp className="h-5 w-5" />
                Generate Cover Page
              </button>
              <button
                type="reset"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200 focus:ring-offset-1"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CoverForm
