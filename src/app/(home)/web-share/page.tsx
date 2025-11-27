import WebSharePage from "@/components/mobile/web-share"
import { Suspense } from "react"

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WebSharePage />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
        <p className="text-gray-600">Loading session...</p>
      </div>
    </div>
  )
}
