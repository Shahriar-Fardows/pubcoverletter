import { useEffect, useState } from "react"
import { Trash2, Plus, AlertCircle, CheckCircle } from "lucide-react"

type BlockedStudent = {
  _id: string
  studentId: string
  reason?: string
  createdAt?: string
}

export default function BlockedStudentsPage() {
  const [blockedStudents, setBlockedStudents] = useState<BlockedStudent[]>([])
  const [studentId, setStudentId] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const ITEMS_PER_PAGE = 10

  const loadBlockedStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/blocked-students", { cache: "no-store" })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || "Failed to load data")
      }

      setBlockedStudents(json.data || [])
    } catch (err) {
      console.error(err)
      setError("ডাটা লোড করতে সমস্যা হয়েছে")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBlockedStudents()
  }, [])

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!studentId.trim()) {
      setError("Student ID দিতে হবে")
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch("/api/blocked-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.trim(),
          reason: reason.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || "Something went wrong")
      }

      setSuccess(json.message || "Student blocked successfully")
      setStudentId("")
      setReason("")
      await loadBlockedStudents()
      setCurrentPage(1)
    } catch (err) {
      console.error(err)
      setError("Block add করতে সমস্যা হয়েছে")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const sure = window.confirm("এই student unblock করতে চান?")
    if (!sure) return

    try {
      const res = await fetch(`/api/blocked-students?id=${id}`, {
        method: "DELETE",
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || "Delete failed")
      }

      setBlockedStudents((prev) => prev.filter((item) => item._id !== id))
      setSuccess("Student unblocked successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error(err)
      setError("Unblock করতে সমস্যা হয়েছে")
    }
  }

  const totalPages = Math.ceil(blockedStudents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = blockedStudents.slice(startIndex, endIndex)

  return (
    <div className=" bg-gray-900 text-white p-6">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-400">Manage blocked student list</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Form Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">➕ Student Block করুন</h2>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Student ID *
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="যেমন: 2511086038"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="যেমন: Cheating / Misuse"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddBlock}
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded transition flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {submitting ? "Saving..." : "Block Add"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : blockedStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-400">কোনো blocked student নেই।</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Student ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Blocked At</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((item) => (
                      <tr key={item._id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                        <td className="px-4 py-3 text-sm font-mono">{item.studentId}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{item.reason || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString("bn-BD") : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition inline-flex"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-900 border-t border-gray-700 px-4 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
                    >
                      ← Prev
                    </button>

                    <div className="flex gap-1">
                      {(() => {
                        const pageWindow = 5
                        let startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2))
                        const endPage = Math.min(totalPages, startPage + pageWindow - 1)
                        
                        if (endPage - startPage + 1 < pageWindow) {
                          startPage = Math.max(1, endPage - pageWindow + 1)
                        }

                        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-2.5 py-1.5 rounded text-sm font-semibold transition ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {page}
                          </button>
                        ))
                      })()}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
                    >
                      Next →
                    </button>

                    <div className="ml-4 text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}