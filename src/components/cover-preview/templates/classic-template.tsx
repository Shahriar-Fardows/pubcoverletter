import type React from "react"
import type { CoverFormValues } from "@/components/cover-form/typs"

type AcademicTemplateProps = {
  data: CoverFormValues
}

const AcademicTemplate: React.FC<AcademicTemplateProps> = ({ data }) => {
  return (
    <div className="relative w-full h-full bg-white flex flex-col justify-between px-8 py-12 print:px-12 print:py-16">
      {/* Top Border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700" />

      {/* Header */}
      <div className="text-center mb-10">
        {data.logoUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={data.logoUrl || "/placeholder.svg"}
              alt="Institute Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
        )}
        <p className="text-xs font-serif text-amber-900 tracking-widest mb-2">
          {data.department}
        </p>
        <p className="text-center ">{data.universityName}</p>
        <p className="text-sm font-serif text-zinc-700 italic">
          Academic Excellence Since Excellence Began
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center text-center space-y-8">
        <div>
          <p className="text-xs font-serif text-amber-700 uppercase mb-4">
            {data.courseName}
          </p>
          <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-4">
            {data.coverTitle}
          </h1>
          <p className="text-sm font-serif text-zinc-600">
            Course Code: {data.courseCode}
          </p>
        </div>

        {/* Information Section */}
        <div className="space-y-6 text-sm font-serif">
          <div>
            <p className="text-amber-700 font-semibold mb-1">Prepared By</p>
            <p className="text-zinc-900 font-semibold">{data.studentName}</p>
            <p className="text-zinc-600 text-xs">{data.studentID}</p>
          </div>

          <div className="flex justify-center">
            <div className="w-12 h-px bg-amber-700" />
          </div>

          <div>
            <p className="text-amber-700 font-semibold mb-1">Supervised By</p>
            <p className="text-zinc-900 font-semibold">{data.teacherName}</p>
            <p className="text-zinc-600 text-xs">{data.teacherPosition}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs font-serif text-zinc-600 space-y-1 border-t border-amber-700 pt-4">
        {data.sectionBatch && <p>{data.sectionBatch}</p>}
        {data.submissionDate && <p>{data.submissionDate}</p>}
      </div>

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700" />
    </div>
  )
}

export default AcademicTemplate
