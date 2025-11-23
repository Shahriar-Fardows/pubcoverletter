"use client"

import { useState } from "react"
import type { ComponentType } from "react"
import CoverForm from "@/components/cover-form/coverForm"
import CoverPreview from "@/components/cover-preview/coverPreview"

export type CoverFormValues = {
  logoFile: File | null
  logoUrl: string | null
  coverTitle: string
  courseName: string
  courseCode: string
  studentName: string
  studentID: string
  submissionDate: string
  sectionBatch: string
  teacherName: string
  teacherPosition: string
  department: string
}

export default function Home() {
  const [coverData, setCoverData] = useState<CoverFormValues | null>(null)

  const handleGenerate = (data: CoverFormValues) => {
    setCoverData(data)
  }

  // cast the imported component to a typed ComponentType so TS knows it accepts coverData
  const CoverPreviewTyped = CoverPreview as unknown as ComponentType<{ coverData: CoverFormValues | null }>

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 py-8 px-4 print:grid-cols-1">
      <div className="no-print">
        <CoverForm onGenerate={handleGenerate} />
      </div>
      <div className="print:w-full">
        <CoverPreviewTyped coverData={coverData} />
      </div>
    </div>
  )
}