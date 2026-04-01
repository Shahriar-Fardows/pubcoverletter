import { useEffect, useState } from "react"
import { Trash2, Plus, AlertCircle, CheckCircle, ShieldBan, Flag, ChevronRight, ChevronLeft } from "lucide-react"

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
      setError("Student ID is mandatory")
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

      setSuccess(json.message || "Access suspended successfully")
      setStudentId("")
      setReason("")
      await loadBlockedStudents()
      setCurrentPage(1)
    } catch (err) {
      console.error(err)
      setError("Failed to execute suspension")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const sure = window.confirm("Are you certain you wish to unblock this user?")
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
      setSuccess("Suspension lifted successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error(err)
      setError("Failed to lift suspension")
    }
  }

  const totalPages = Math.max(1, Math.ceil(blockedStudents.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = blockedStudents.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Alert Messages */}
      {error && (
        <div className="animate-in fade-in flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="animate-in fade-in flex items-center gap-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-emerald-400">
          <CheckCircle size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Form Section */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 shadow-lg backdrop-blur-md">
        <div className="mb-5 flex items-center gap-2 text-white">
          <ShieldBan className="h-5 w-5 text-red-400" />
          <h3 className="text-lg font-semibold tracking-wide">Suspend User Access</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Student ID Target</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
              placeholder="e.g. 2511086038"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Suspension Reason <span className="opacity-50">(optional)</span></label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
              placeholder="e.g. Exploiting prints"
            />
          </div>

          <div className="flex items-end">
             <button
                onClick={handleAddBlock}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white shadow-[0_0_15px_-3px_rgba(220,38,38,0.5)] transition hover:bg-red-500 disabled:opacity-50"
              >
                {submitting ? (
                  "Enforcing..."
                ) : (
                  <>
                     <Plus size={18} /> Execute Block
                  </>
                )}
             </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/70 shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto w-full">
          <table className="w-full whitespace-nowrap text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Student ID</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Logged Reason</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Restriction Date</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && blockedStudents.length === 0 ? (
                <tr>
                   <td colSpan={4} className="py-12 text-center text-slate-500">
                     <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-red-500"></div>
                     <p className="mt-3 font-medium">Loading restrictions...</p>
                   </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-500">
                    <Flag className="inline-block mb-3 h-10 w-10 opacity-50 text-emerald-500" />
                    <p className="font-medium text-lg text-emerald-400">All Clear.</p>
                    <p className="mt-1 text-sm">No restrictions are currently enforced on the network.</p>
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr key={item._id} className="group hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono font-medium text-slate-200">{item.studentId}</span>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="rounded bg-slate-800/60 px-2 py-1 text-xs font-medium text-slate-400 border border-slate-700/50">
                        {item.reason || "Unspecified Offense"}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-slate-400 text-xs group-hover:text-slate-300 transition-colors">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString("en-US", { dateStyle: 'medium', timeStyle: 'short' }) : "N/A"}
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                       <button
                          onClick={() => handleDelete(item._id)}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-500/10 p-2 text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-white"
                          title="Lift Suspension"
                        >
                          <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-700/50 bg-slate-800/40 px-6 py-4">
            <div className="hidden sm:block text-xs font-medium text-slate-400">
              Displaying <span className="text-slate-200">{Math.min(endIndex, blockedStudents.length)}</span> active restrictions.
            </div>
            <div className="flex w-full sm:w-auto items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {(() => {
                  let start = Math.max(1, currentPage - 2);
                  const end = Math.min(totalPages, start + 4);
                  if (end - start < 4) start = Math.max(1, end - 4);

                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                   <button
                     key={p}
                     onClick={() => setCurrentPage(p)}
                     className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                       p === currentPage 
                       ? "bg-red-600 text-white shadow-lg shadow-red-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.2)]" 
                       : "text-slate-400 hover:bg-slate-700 hover:text-white"
                     }`}
                   >
                     {p}
                   </button>
                  ));
                })()}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}