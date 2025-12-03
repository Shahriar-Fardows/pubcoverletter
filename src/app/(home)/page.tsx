"use client"

import { useState, type ComponentType } from "react"
import CoverForm from "@/components/cover-form/coverForm"
import CoverPreview from "@/components/cover-preview/coverPreview"
import type { CoverFormValues } from "@/components/cover-form/typs"

type TemplateId = "basic" | "formal"

export default function Home() {
  const [coverData, setCoverData] = useState<CoverFormValues | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<TemplateId>("basic")

  const handleGenerate = (data: CoverFormValues) => {
    setCoverData(data)
  }

  // cast the imported component to a typed ComponentType so TS knows it accepts coverData
  const CoverPreviewTyped =
    CoverPreview as unknown as ComponentType<{
      coverData: CoverFormValues | null
      selectedTemplateId: TemplateId
      onTemplateChange: (id: TemplateId) => void
    }>

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 py-8 px-4 print:grid-cols-1">
      <div className="no-print">
        <CoverForm
          onGenerate={handleGenerate}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
        />
      </div>
      <div className="print:w-full">
        <CoverPreviewTyped
          coverData={coverData}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
        />
      </div>
    </div>
  )
}
