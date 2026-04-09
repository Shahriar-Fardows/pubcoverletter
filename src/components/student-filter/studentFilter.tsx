import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Edit2, Search, CheckSquare, Square, ChevronLeft, ChevronRight, Calendar, Filter, Users, ShieldAlert } from 'lucide-react';
import Swal from 'sweetalert2';

type Student = {
  _id: string;
  studentId: string;
  studentName: string;
  section: string;
  batch: string;
  department: string;
  courseName: string;
  teacherName: string;
  createDate: string;
};

const ITEMS_PER_PAGE = 20;

export default function StudentFilter() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('studentName');
  const [filterDept, setFilterDept] = useState('All');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, last7
  const [sortBy, setSortBy] = useState('newest');

  // Edit modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Student>>({});

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const response = await res.json();
      
      const studentList = response.data || [];
      setStudents(studentList);
      applyFilters(studentList, searchQuery, searchField, filterDept, dateFilter, sortBy);
    } catch (error) {
      console.error('Failed to fetch:', error);
      Swal.fire({
        icon: 'error',
        title: 'Connection Failed',
        text: 'Unable to sync data from the main server.',
        background: '#1e293b',
        color: '#f8fafc'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayString = (dateObj: Date) => {
    return `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`;
  }

  const applyFilters = (
    dataToFilter: Student[], 
    sQuery: string, 
    sField: string, 
    fDept: string,
    dFilter: string,
    sBy: string
  ) => {
    let filtered = [...dataToFilter];

    if (fDept !== 'All') {
      filtered = filtered.filter(s => s.department === fDept);
    }

    if (sQuery) {
      filtered = filtered.filter(s => {
        const value = s[sField as keyof Student];
        return String(value || '').toLowerCase().includes(sQuery.toLowerCase());
      });
    }

    const todayDate = new Date();
    const todayStr = getDayString(todayDate);
    
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getDayString(yesterdayDate);

    if (dFilter === 'today') {
      filtered = filtered.filter(s => s.createDate === todayStr);
    } else if (dFilter === 'yesterday') {
      filtered = filtered.filter(s => s.createDate === yesterdayStr);
    } else if (dFilter === 'last7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thresholdTime = sevenDaysAgo.getTime();
      
      filtered = filtered.filter(s => {
        if (!s.createDate) return false;
        try {
          const t = new Date(s.createDate.split('/').reverse().join('-')).getTime();
          return t >= thresholdTime;
        } catch { return false; }
      });
    }

    // Sort heavily utilizing MongoDB _id which embeds exact timestamp, 
    // eliminating issues where records created on the same day juggle.
    filtered.sort((a, b) => {
      if (sBy === 'newest') {
        return b._id.localeCompare(a._id);
      } else {
        return a._id.localeCompare(b._id);
      }
    });

    setFilteredStudents(filtered);
    setSelected(new Set());
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters(students, searchQuery, searchField, filterDept, dateFilter, sortBy);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchField, filterDept, dateFilter, sortBy, students]);

  const departments = useMemo(() => {
    const depts = new Set(students.map(s => s.department).filter(d => Boolean(d)));
    return Array.from(depts).sort();
  }, [students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === currentData.length && currentData.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(currentData.map(s => s._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;

    const confirm = await Swal.fire({
      title: 'Initialize Deletion?',
      text: `Deleting ${selected.size} cover logs. This cannot be reversed.`,
      icon: 'warning',
      background: '#1e293b',
      color: '#f8fafc',
      showCancelButton: true,
      confirmButtonText: 'Confirm Extermination',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569'
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      for (const id of selected) {
        await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
      }
      Swal.fire({
        title: 'Deleted', 
        text: 'Records purged securely.', 
        icon: 'success', 
        background: '#1e293b',
        color: '#f8fafc'
      });
      setSelected(new Set());
      await fetchStudents();
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      Swal.fire({
        title: 'Error', 
        text: 'Failed to purge data.', 
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Delete specific log?',
      text: 'Are you sure?',
      icon: 'warning',
      background: '#1e293b',
      color: '#f8fafc',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569'
    });

    if (confirm.isConfirmed) {
      try {
        await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
        fetchStudents();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/students?id=${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        Swal.fire({title: 'Updated!', icon: 'success', background: '#1e293b', color: '#f8fafc'});
        setEditingId(null);
        fetchStudents();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 shadow-lg backdrop-blur-md">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Filter className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold tracking-wide">Data Filters</h3>
          </div>
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 border border-red-500/20"
            >
              <Trash2 size={16} /> Purge Selected ({selected.size})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-slate-400">Deep Search</label>
            <div className="flex w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900/50 shadow-inner focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="bg-transparent border-r border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 outline-none focus:bg-slate-800"
              >
                <option value="studentName">Student Name</option>
                <option value="studentId">Student ID</option>
                <option value="teacherName">Teacher</option>
                <option value="courseName">Course</option>
              </select>
              <div className="flex w-full items-center px-3">
                <Search size={16} className="text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter keywords..."
                  className="w-full bg-transparent px-2 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Department</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-300 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="All">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Time Frame</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-300 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="all">All Time</option>
              <option value="today">Today&apos;s Data Only</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Ordering</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-300 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="newest">Most Recent First</option>
              <option value="oldest">Chronological Oldest</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm font-medium text-slate-400 px-1">
        <p>Showing <span className="text-white">{filteredStudents.length}</span> results tailored to your query parameters</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/70 shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto w-full">
          <table className="w-full whitespace-nowrap text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-5 py-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center w-full text-slate-400 hover:text-white transition-colors">
                    {selected.size === currentData.length && currentData.length > 0 ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-4 font-semibold tracking-wider">Student Profile</th>
                <th className="px-4 py-4 font-semibold tracking-wider">Academics</th>
                <th className="px-4 py-4 font-semibold tracking-wider">Assignment</th>
                <th className="px-4 py-4 font-semibold tracking-wider">Timestamp</th>
                <th className="px-4 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <ShieldAlert className="inline-block mb-3 h-10 w-10 opacity-50" />
                    <p className="font-medium text-lg text-slate-400">Zero Matches Found.</p>
                    <p className="mt-1 text-sm">Try adjusting your filtration metrics.</p>
                  </td>
                </tr>
              ) : (
                currentData.map((student) => (
                  <tr key={student._id} className="group hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 align-middle text-center">
                      <button onClick={() => toggleSelect(student._id)} className="text-slate-500 hover:text-slate-300 transition-colors">
                        {selected.has(student._id) ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100">{student.studentName}</span>
                        <span className="text-xs font-mono text-slate-500 mt-0.5">ID: {student.studentId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-200 truncate max-w-[200px]" title={student.department}>{student.department}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">Sec {student.section}</span>
                          {student.batch && <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">Bth {student.batch}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="text-emerald-400 font-medium truncate max-w-[180px]" title={student.courseName}>{student.courseName}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                           <Users size={12} className="opacity-70" /> {student.teacherName}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 w-fit px-2.5 py-1 rounded-full border border-slate-700/50 text-xs font-medium">
                        <Calendar size={12} className="text-blue-400" />
                        {student.createDate}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(student._id); setEditData(student); }}
                          className="flex items-center justify-center p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                          title="Edit Info"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="flex items-center justify-center p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          title="Erase Log"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Nav Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-700/50 bg-slate-800/40 px-6 py-4">
            <div className="hidden sm:block text-xs font-medium text-slate-400">
              Displaying <span className="text-slate-200">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredStudents.length)}</span> out of <span className="text-slate-200">{filteredStudents.length}</span>
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
                       ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.2)]" 
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

      {editingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-700 bg-slate-900/50 px-6 py-4">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Edit2 size={20} className="text-blue-400" />
                Edit Profile Configurations
              </h2>
              <p className="text-xs font-medium text-slate-400 mt-1">Make changes to the core metrics associated with this log.</p>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto hide-scrollbar">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {Object.keys(editData).map(key => {
                  if (key === '_id') return null;
                  return (
                    <div key={key} className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input
                        type="text"
                        value={editData[key as keyof Student] || ''}
                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 outline-none transition-all placeholder:text-slate-600 hover:border-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 border-t border-slate-700 bg-slate-900/50 px-6 py-4">
              <button
                onClick={() => setEditingId(null)}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                Cancel Edit
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold shadow-lg shadow-blue-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.2)] transition-all hover:bg-blue-500 hover:shadow-blue-500/40 text-white"
              >
                Sync Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}