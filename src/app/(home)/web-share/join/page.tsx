import JoinSharePage from "@/components/mobile/join-share"
import { Suspense } from "react"

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinLoadingFallback />}>
      <JoinSharePage />
    </Suspense>
  )
}

function JoinLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
        </div>
        <p className="text-gray-600">Loading session...</p>
      </div>
    </div>
  )
}
