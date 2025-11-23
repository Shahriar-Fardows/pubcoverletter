import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Search, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 10;

export default function StudentFilter() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('studentName');
  const [filterDept, setFilterDept] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Edit modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Student>>({});

  // Departments list
  const departments = [
    'Department of Electrical & Electronic Engineering',
    'Department of Civil Engineering',
    'Department of Mechanical Engineering',
    'Department of Computer Science',
  ];

  // Fetch all data
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const response = await res.json();
      
      // API returns {total, data: [...]}
      const studentList = response.data || [];
      
      setStudents(studentList);
      applyFilters(studentList);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch:', error);
      Swal.fire({
        icon: 'error',
        title: 'ডেটা লোড করতে ব্যর্থ',
        text: 'সার্ভার থেকে ডেটা আনতে সমস্যা হয়েছে',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to data
  const applyFilters = (dataToFilter: Student[]) => {
    let filtered = [...dataToFilter];

    // Department filter
    if (filterDept) {
      filtered = filtered.filter(s => s.department === filterDept);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s => {
        const value = s[searchField as keyof Student];
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Sort
    filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.createDate.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.createDate.split('/').reverse().join('-')).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      } catch {
        return 0;
      }
    });

    setFilteredStudents(filtered);
    setSelected(new Set());
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters(students);
  }, [searchQuery, searchField, filterDept, sortBy, students]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setIsRefreshing(false);
  };

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = filteredStudents.slice(startIndex, endIndex);

  // Toggle selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  // Select all on current page
  const toggleSelectAll = () => {
    if (selected.size === currentData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(currentData.map(s => s._id)));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selected.size === 0) {
      Swal.fire('No selection', 'Please select records to delete', 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Delete Records?',
      text: `Are you sure you want to delete ${selected.size} record(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      confirmButtonColor: '#dc2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      for (const id of selected) {
        await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
      }
      Swal.fire('Deleted!', 'Records deleted successfully', 'success');
      setSelected(new Set());
      fetchStudents();
    } catch (error) {
      Swal.fire('Error', 'Failed to delete records', 'error');
    }
  };

  // Edit student
  const handleEdit = (student: Student) => {
    setEditingId(student._id);
    setEditData(student);
  };

  // Save edit
  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/students?id=${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        Swal.fire('Updated!', 'Record updated successfully', 'success');
        setEditingId(null);
        fetchStudents();
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to update record', 'error');
    }
  };

  // Delete single
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Delete?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
    });

    if (confirm.isConfirmed) {
      try {
        await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
        Swal.fire('Deleted!', '', 'success');
        fetchStudents();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mx-auto">
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-lg font-bold mb-4">🔍 Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Search Field</label>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="studentName">Student Name</option>
                <option value="studentId">Student ID</option>
                <option value="teacherName">Teacher Name</option>
                <option value="courseName">Course Name</option>
              </select>
            </div>

            {/* Search Query */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Search Query {searchQuery && filteredStudents.length > 0 && (
                  <span className="text-blue-400 ml-1">({filteredStudents.length})</span>
                )}
              </label>
              <div className="flex items-center bg-gray-700 border border-gray-600 rounded">
                <Search size={18} className="ml-3 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="flex-1 px-3 py-2 text-sm outline-none bg-gray-700 text-white"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Department</label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition disabled:bg-gray-600"
            >
              {isRefreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
            {selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold transition"
              >
                <Trash2 size={16} /> Delete ({selected.size})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No records found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button onClick={toggleSelectAll} className="text-white">
                          {selected.size === currentData.length && currentData.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Section</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Course</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Teacher</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Batch</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((student) => (
                      <tr key={student._id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(student._id)}>
                            {selected.has(student._id) ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">{student.studentId}</td>
                        <td className="px-4 py-3 text-sm">{student.studentName}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{student.department}</td>
                        <td className="px-4 py-3 text-sm">{student.section}</td>
                        <td className="px-4 py-3 text-sm">{student.courseName}</td>
                        <td className="px-4 py-3 text-sm">{student.teacherName}</td>
                        <td className="px-4 py-3 text-sm">{student.batch}</td>
                        <td className="px-4 py-3 text-sm">{student.createDate}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEdit(student)}
                              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(student._id)}
                              className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
                      const pageWindow = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2));
                      const endPage = Math.min(totalPages, startPage + pageWindow - 1);
                      
                      if (endPage - startPage + 1 < pageWindow) {
                        startPage = Math.max(1, endPage - pageWindow + 1);
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
                      ));
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
                    Page {currentPage} of {totalPages} | Showing {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">✏️ Edit Student</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(editData).map(key => {
                  if (key === '_id') return null;
                  return (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-300 mb-1 capitalize">{key}</label>
                      <input
                        type="text"
                        value={editData[key as keyof Student] || ''}
                        onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 border border-gray-600 text-gray-300 py-2 rounded font-semibold hover:bg-gray-700 transition"
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}