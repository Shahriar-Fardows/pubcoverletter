// app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Trash2, Edit2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

// Types
interface Student {
  _id: string;
  studentId: number;
  studentName: string;
  section: string;
  department: string;
  courseName: string;
  teacherName: string;
  createDate: string;
}

interface FilterState {
  studentId: string;
  date: string;
  department: string;
  section: string;
  status: string;
}

interface FormData {
  studentId: string | number;
  studentName: string;
  section: string;
  department: string;
  courseName: string;
  teacherName: string;
}

interface MonthlyData {
  date: string;
  prints: number;
}

export default function AdminPortal() {
  const API_URL = 'http://localhost:3000/api/students';
  const ITEMS_PER_PAGE = 10;

  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Statistics
  const [totalPrints, setTotalPrints] = useState<number>(0);
  const [todayPrints, setTodayPrints] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [uniqueStudents, setUniqueStudents] = useState<number>(0);

  // Charts Data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthPrints, setCurrentMonthPrints] = useState<number>(0);
  const [currentMonthName, setCurrentMonthName] = useState<string>('');

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    studentId: '',
    date: '',
    department: 'All Departments',
    section: 'All Sections',
    status: 'All Students',
  });

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    studentName: '',
    section: '',
    department: '',
    courseName: '',
    teacherName: '',
  });

  // Departments and sections list
  const [departmentList, setDepartmentList] = useState<string[]>([]);
  const [sectionList, setSectionList] = useState<string[]>([]);

  // Fetch data
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch');
      let data = await response.json();

      // Handle if data is wrapped in object
      if (data.data && Array.isArray(data.data)) {
        data = data.data;
      } else if (!Array.isArray(data)) {
        data = [];
      }

      const studentData: Student[] = data;
      setStudents(studentData);
      calculateStats(studentData);
      extractDropdownData(studentData);
      applyFilters(studentData, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractDropdownData = (data: Student[]): void => {
    const depts = [...new Set(data.map((s) => s.department))];
    const sects = [...new Set(data.map((s) => s.section || 'Not provided'))];
    setDepartmentList(depts as string[]);
    setSectionList(sects as string[]);
  };

  const calculateStats = (data: Student[]): void => {
    // Total prints
    setTotalPrints(data.length);

    // Today's prints
    const today = new Date().toLocaleDateString('en-GB');
    const todayCount = data.filter((d) => d.createDate === today).length;
    setTodayPrints(todayCount);

    // Unique students
    const uniqueIds = new Set(data.map((d) => d.studentId));
    setUniqueStudents(uniqueIds.size);
    setTotalUsers(data.length);

    // Monthly data
    const monthMap: Record<string, number> = {};
    data.forEach((d) => {
      const date = d.createDate;
      monthMap[date] = (monthMap[date] || 0) + 1;
    });

    const monthlyArray: MonthlyData[] = Object.entries(monthMap)
      .map(([date, count]) => ({
        date,
        prints: count,
      }))
      .sort(
        (a, b) =>
          new Date(a.date.split('/').reverse().join('-')).getTime() -
          new Date(b.date.split('/').reverse().join('-')).getTime()
      );

    setMonthlyData(monthlyArray);

    // Current month prints
    const currentDate = new Date();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    setCurrentMonthName(monthNames[currentDate.getMonth()]);

    const currentMonthData = monthlyArray[monthlyArray.length - 1];
    setCurrentMonthPrints(currentMonthData?.prints || 0);
  };

  const applyFilters = (data: Student[], currentFilters: FilterState): void => {
    let result = [...data];

    if (currentFilters.studentId) {
      result = result.filter((s) =>
        s.studentId.toString().includes(currentFilters.studentId)
      );
    }

    if (currentFilters.date) {
      result = result.filter((s) => s.createDate === currentFilters.date);
    }

    if (currentFilters.department !== 'All Departments') {
      result = result.filter((s) => s.department === currentFilters.department);
    }

    if (currentFilters.section !== 'All Sections') {
      result = result.filter((s) => s.section === currentFilters.section);
    }

    setFilteredStudents(result);
    setCurrentPage(1);
  };

  const handleFilterClick = (): void => {
    applyFilters(students, filters);
  };

  const handleFilterChange = (key: keyof FilterState, value: string): void => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleResetFilters = (): void => {
    const resetFilters: FilterState = {
      studentId: '',
      date: '',
      department: 'All Departments',
      section: 'All Sections',
      status: 'All Students',
    };
    setFilters(resetFilters);
    applyFilters(students, resetFilters);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Delete এই Record?')) return;

    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchStudents();
        alert('Delete হয়েছে!');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Error: ' + errorMessage);
    }
  };

  const handleEdit = (student: Student): void => {
    setEditingId(student._id);
    setFormData(student);
    setShowModal(true);
  };

  const handleAddNew = (): void => {
    setEditingId(null);
    setFormData({
      studentId: '',
      studentName: '',
      section: '',
      department: '',
      courseName: '',
      teacherName: '',
    });
    setShowModal(true);
  };

  const handleSave = async (): Promise<void> => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_URL}?id=${editingId}` : API_URL;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchStudents();
        setShowModal(false);
        alert(editingId ? 'Update হয়েছে!' : 'Add হয়েছে!');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Error: ' + errorMessage);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

  if (loading)
    return (
      <div className="p-8 text-center text-lg bg-gray-900 min-h-screen text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📊 Admin Dashboard</h1>
          <p className="text-gray-400">Student Cover Page Management System</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg">
            <div className="text-gray-200 text-sm mb-2">Total Prints</div>
            <div className="text-3xl font-bold">{totalPrints}</div>
          </div>
          <div className="bg-green-600 p-6 rounded-lg">
            <div className="text-gray-200 text-sm mb-2">Today&apos;s Prints</div>
            <div className="text-3xl font-bold">{todayPrints}</div>
          </div>
          <div className="bg-purple-600 p-6 rounded-lg">
            <div className="text-gray-200 text-sm mb-2">Unique Students</div>
            <div className="text-3xl font-bold">{uniqueStudents}</div>
          </div>
          <div className="bg-orange-600 p-6 rounded-lg">
            <div className="text-gray-200 text-sm mb-2">{currentMonthName}</div>
            <div className="text-3xl font-bold">{currentMonthPrints}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">📈 Monthly Prints Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="prints"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">📊 Print Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                />
                <Legend />
                <Bar dataKey="prints" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-bold mb-4">🔍 Filter Data</h3>
          <div className="grid grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Student ID:"
              value={filters.studentId}
              onChange={(e) => handleFilterChange('studentId', e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white placeholder-gray-400"
            />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white"
            />
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white"
            >
              <option value="All Departments">All Departments</option>
              {departmentList.map((dept) => (
                <option key={dept || 'unknown'} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white"
            >
              <option value="All Sections">All Sections</option>
              {sectionList.map((sec) => (
                <option key={sec || 'unknown'} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleFilterClick}
                className="flex-1 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Filter size={18} /> Filter
              </button>
              <button
                onClick={handleResetFilters}
                className="flex-1 bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-3 text-left">Student ID</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Course</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student, idx) => (
                  <tr
                    key={student._id}
                    className={idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}
                  >
                    <td className="px-6 py-3">{student.studentId}</td>
                    <td className="px-6 py-3">{student.studentName || 'N/A'}</td>
                    <td className="px-6 py-3 text-sm">{student.department}</td>
                    <td className="px-6 py-3 text-sm">{student.courseName}</td>
                    <td className="px-6 py-3 text-sm">{student.createDate}</td>
                    <td className="px-6 py-3 flex gap-3">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-400 hover:text-blue-300 transition"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="text-red-400 hover:text-red-300 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-700 text-gray-300 flex items-center justify-between">
            <div>
              Page {currentPage} of {totalPages} | Total Records:{' '}
              {filteredStudents.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                disabled={currentPage === 1}
                className="bg-gray-600 disabled:bg-gray-800 px-3 py-2 rounded hover:bg-gray-500 transition flex items-center gap-1"
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="bg-gray-600 disabled:bg-gray-800 px-3 py-2 rounded hover:bg-gray-500 transition flex items-center gap-1"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? 'Edit Student' : 'Add New Student'}
              </h2>

              <input
                type="number"
                placeholder="Student ID"
                value={formData.studentId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    studentId: e.target.value,
                  })
                }
                className="w-full bg-gray-700 px-4 py-2 rounded mb-3 text-white placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Student Name"
                value={formData.studentName}
                onChange={(e) =>
                  setFormData({ ...formData, studentName: e.target.value })
                }
                className="w-full bg-gray-700 px-4 py-2 rounded mb-3 text-white placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full bg-gray-700 px-4 py-2 rounded mb-3 text-white placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Course Name"
                value={formData.courseName}
                onChange={(e) =>
                  setFormData({ ...formData, courseName: e.target.value })
                }
                className="w-full bg-gray-700 px-4 py-2 rounded mb-3 text-white placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Section"
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                className="w-full bg-gray-700 px-4 py-2 rounded mb-3 text-white placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Teacher Name"
                value={formData.teacherName}
                onChange={(e) =>
                  setFormData({ ...formData, teacherName: e.target.value })
                }
                className="w-full bg-gray-700 px-4 py-2 rounded mb-6 text-white placeholder-gray-400"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 py-2 rounded hover:bg-green-700 transition font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-600 py-2 rounded hover:bg-gray-700 transition font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}