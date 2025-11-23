"use client"

import type React from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Printer } from "lucide-react"
import type { CoverFormValues } from "@/components/cover-form/typs"
import Basic from "./templates/basic"
import Formal from "./templates/formal"

type Template = {
  id: string
  name: string
  component: React.ComponentType<{ data: CoverFormValues }>
}

type CoverPreviewProps = {
  coverData: CoverFormValues | null
}

const TEMPLATES: Template[] = [
  {
    id: "basic",
    name: "Basic",
    component: Basic,
  },
  {
    id: "formal",
    name: "Formal",
    component: Formal,
  },
]

const CoverPreview: React.FC<CoverPreviewProps> = ({ coverData }) => {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0)
  const currentTemplate = TEMPLATES[currentTemplateIndex]
  const TemplateComponent = currentTemplate.component

  const handlePrevious = () => {
    setCurrentTemplateIndex((prev) => (prev === 0 ? TEMPLATES.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentTemplateIndex((prev) => (prev === TEMPLATES.length - 1 ? 0 : prev + 1))
  }

  const handlePrint = () => {
    window.print()
  }

  // Ei ta protibar render e notun date dibe
  const today = new Date().toISOString().split("T")[0]

  // MAIN PART: user data + default merge
  const displayData: CoverFormValues = {
    // logo
    logoFile: coverData?.logoFile || null,
    logoUrl: coverData?.logoUrl || "/pubcoverletter.png",

    // jekono string field e: user value na thakle default use hobe
    coverTitle: coverData?.coverTitle || "Assignment",
    courseName: coverData?.courseName || "Calculus I",
    courseCode: coverData?.courseCode || "MAT123",
    studentName: coverData?.studentName || "Nafisa Yeasmin",
    studentID: coverData?.studentID || "2511086038",
    submissionDate: coverData?.submissionDate || today,
    sectionBatch: coverData?.sectionBatch || "1st",
    teacherName: coverData?.teacherName || "NAFIA MOLLIK",
    teacherPosition: coverData?.teacherPosition || "Lecturer",
    department: coverData?.department || "Department of Computer Science & Engineering",
    universityName: coverData?.universityName || "Presidency University",
  }

  return (
    <div className="space-y-4 print:space-y-0">
      {/* Controls (template slider + print button in one line) */}
      <div className="no-print flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
        {/* Template slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Previous template"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-900">
              {currentTemplate.name} Template
            </span>
            <span className="text-[11px] text-zinc-500">
              {currentTemplateIndex + 1} of {TEMPLATES.length}
            </span>
          </div>

          <button
            onClick={handleNext}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Next template"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Print button */}
        <button
          onClick={handlePrint}
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1"
        >
          <Printer className="h-4 w-4" />
          Print cover page
        </button>
      </div>

      {/* Preview Container - only this will be printed */}
      <div
        id="cover-print-area"
        className="relative overflow-hidden border border-zinc-200 bg-white shadow-lg print:rounded-none print:border-none print:shadow-none"
      >
        <div className="aspect-[8.1/11] print:aspect-auto">
          <TemplateComponent data={displayData} />
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
      @page {
    
    margin:0px;
    padding:40px;
  }
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .no-print {
            display: none !important;
          }

          body * {
            visibility: hidden;
          }

          #cover-print-area,
          #cover-print-area * {
            visibility: visible;
          }

          #cover-print-area {
            position: absolute;
            inset: 0;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default CoverPreview
