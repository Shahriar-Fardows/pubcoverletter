import React, { useState, useEffect } from "react";
import { FileText, ShieldAlert } from "lucide-react";

type ResumeEntry = {
  _id: string;
  studentName: string;
  studentId?: string;
  department?: string;
  createdAt: string;
};

export default function ResumeAnalytics() {
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes");
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setResumes(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-xl">
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/20 p-3 text-blue-400">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Generates</p>
            <h3 className="text-3xl font-extrabold text-white">{resumes.length}</h3>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/70 shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto w-full">
          <table className="w-full whitespace-nowrap text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Student Profile</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Department</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Generation Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                   <td colSpan={3} className="py-12 text-center text-slate-500">
                     <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                     <p className="mt-3 font-medium">Loading generation logs...</p>
                   </td>
                </tr>
              ) : resumes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-slate-500">
                    <ShieldAlert className="inline-block mb-3 h-10 w-10 opacity-50" />
                    <p className="font-medium text-lg text-slate-400">No Resumes Generated Yet.</p>
                  </td>
                </tr>
              ) : (
                resumes.map((log) => (
                  <tr key={log._id} className="group hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100">{log.studentName}</span>
                        {log.studentId && <span className="text-xs font-mono text-slate-500 mt-0.5">ID: {log.studentId}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="text-slate-200">{log.department || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50 text-xs font-medium text-slate-300">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
