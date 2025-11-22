import type React from "react"

import type { CoverFormValues } from "@/components/cover-form/typs"

type ModernTemplateProps = {
  data: CoverFormValues
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ data }) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-between px-8 py-12 print:px-12 print:py-16">
      {/* Header with Logo */}
      <div className="w-full flex flex-col items-center mb-8">
        {data.logoUrl && (
          <div className="mb-6">
            <img src={data.logoUrl || "/placeholder.svg"} alt="Institute Logo" className="h-24 w-24 object-contain" />
          </div>
        )}
        <div className="text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-2">{data.department}</p>
          <h2 className="text-xs font-semibold text-zinc-600">{data.courseCode}</h2>
        </div>
        <p className="text-center ">{data.universityName}</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-8">
          <p className="text-sm text-indigo-600 font-semibold mb-3 uppercase">{data.courseName}</p>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            {data.coverTitle}
          </h1>
        </div>

        <div className="flex gap-8 text-sm mt-12">
          <div>
            <p className="text-zinc-500 mb-2">Student</p>
            <p className="font-bold text-zinc-900">{data.studentName}</p>
            <p className="text-xs text-zinc-600">{data.studentID}</p>
          </div>
          <div className="w-px bg-zinc-300"></div>
          <div>
            <p className="text-zinc-500 mb-2">Instructor</p>
            <p className="font-bold text-zinc-900">{data.teacherName}</p>
            <p className="text-xs text-zinc-600">{data.teacherPosition}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-zinc-600 text-center space-y-1">
        <p>{data.sectionBatch}</p>
        {data.submissionDate && <p>{data.submissionDate}</p>}
      </div>
    </div>
  )
}

export default ModernTemplate
