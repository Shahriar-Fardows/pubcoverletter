"use client";

import React, { useState, useEffect } from "react";
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
} from "recharts";
import { Trash2, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import AnalyticsChart from "@/components/analytics-chart/analyticsChart";

interface Student {
  _id: string;
  studentId: number;
  studentName: string;
  section: string;
  batch?: string;
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
}

interface FormData {
  studentId: string | number;
  studentName: string;
  section: string;
  batch?: string;
  department: string;
  courseName: string;
  teacherName: string;
  createDate?: string;
}

interface MonthlyData {
  date: string;
  prints: number;
}

export default function AdminPortal() {
  const API_URL = "/api/students";
  const ITEMS_PER_PAGE = 10;

  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [totalPrints, setTotalPrints] = useState(0);
  const [todayPrints, setTodayPrints] = useState(0);
  const [uniqueStudents, setUniqueStudents] = useState(0);

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthPrints, setCurrentMonthPrints] = useState(0);
  const [currentMonthName, setCurrentMonthName] = useState("");

  const [filters, setFilters] = useState<FilterState>({
    studentId: "",
    date: "",
    department: "All Departments",
    section: "All Sections",
  });

  const [searchType, setSearchType] = useState<"name" | "studentId" | "course">(
    "name"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    studentId: "",
    studentName: "",
    section: "",
    batch: "",
    department: "",
    courseName: "",
    teacherName: "",
  });

  const [departmentList, setDepartmentList] = useState<string[]>([]);
  const [sectionList, setSectionList] = useState<string[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      let data = await response.json();

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
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setIsRefreshing(false);
  };

  const extractDropdownData = (data: Student[]) => {
    const depts = [...new Set(data.map((s) => s.department))];
    const sects = [...new Set(data.map((s) => s.section || "Not provided"))];
    setDepartmentList(depts as string[]);
    setSectionList(sects as string[]);
  };

  const calculateStats = (data: Student[]) => {
    setTotalPrints(data.length);

    const today = new Date().toLocaleDateString("en-GB");
    const todayCount = data.filter((d) => d.createDate === today).length;
    setTodayPrints(todayCount);

    const uniqueIds = new Set(data.map((d) => d.studentId));
    setUniqueStudents(uniqueIds.size);

    const monthMap: Record<string, number> = {};
    data.forEach((d) => {
      if (d.createDate) {
        monthMap[d.createDate] = (monthMap[d.createDate] || 0) + 1;
      }
    });

    const monthlyArray: MonthlyData[] = Object.entries(monthMap)
      .map(([date, count]) => ({ date, prints: count }))
      .sort((a, b) => {
        try {
          const dateA = new Date(
            a.date.split("/").reverse().join("-")
          ).getTime();
          const dateB = new Date(
            b.date.split("/").reverse().join("-")
          ).getTime();
          return dateA - dateB;
        } catch {
          return 0;
        }
      });

    setMonthlyData(monthlyArray);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentDate = new Date();
    setCurrentMonthName(monthNames[currentDate.getMonth()]);

    const currentMonthData = monthlyArray[monthlyArray.length - 1];
    setCurrentMonthPrints(currentMonthData?.prints || 0);
  };

  const applyFilters = (data: Student[], currentFilters: FilterState) => {
    let result = [...data];

    if (currentFilters.studentId?.trim()) {
      result = result.filter((s) =>
        s.studentId.toString().includes(currentFilters.studentId.trim())
      );
    }

    if (currentFilters.date?.trim()) {
      const parts = currentFilters.date.split("-");
      const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      result = result.filter((s) => s.createDate === formattedDate);
    }

    if (currentFilters.department !== "All Departments") {
      result = result.filter((s) => s.department === currentFilters.department);
    }

    if (currentFilters.section !== "All Sections") {
      result = result.filter((s) => {
        const sectionValue = s.section || "Not provided";
        return sectionValue === currentFilters.section;
      });
    }

    if (searchQuery.trim()) {
      result = result.filter((s) => {
        if (searchType === "name") {
          return (s.studentName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        } else if (searchType === "studentId") {
          return s.studentId.toString().includes(searchQuery);
        } else if (searchType === "course") {
          return (s.courseName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        }
        return true;
      });
    }

    result.sort((a, b) => {
      try {
        const dateAStr = a.createDate
          ? a.createDate.split("/").reverse().join("-")
          : "1970-01-01";
        const dateBStr = b.createDate
          ? b.createDate.split("/").reverse().join("-")
          : "1970-01-01";
        const dateA = new Date(dateAStr).getTime();
        const dateB = new Date(dateBStr).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      } catch {
        return 0;
      }
    });

    setFilteredStudents(result);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters(students, filters);
  }, [searchQuery, searchType, sortOrder]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setTimeout(() => {
      applyFilters(students, newFilters);
    }, 0);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      studentId: "",
      date: "",
      department: "All Departments",
      section: "All Sections",
    };
    setFilters(resetFilters);
    applyFilters(students, resetFilters);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedStudents.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(paginatedStudents.map((s) => s._id));
      setSelectedIds(allIds);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      Swal.fire({
        icon: "warning",
        title: "কোনো রেকর্ড নির্বাচিত নয়!",
        text: "কমপক্ষে একটি রেকর্ড নির্বাচন করুন।",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "নিশ্চিত করুন",
      text: `${selectedIds.size}টি রেকর্ড ডিলিট করবেন?`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "হ্যাঁ, ডিলিট করুন",
      cancelButtonText: "বাতিল",
    });

    if (result.isConfirmed) {
      try {
        for (const id of selectedIds) {
          await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
        }
        const count = selectedIds.size;
        const updatedStudents = students.filter((s) => !selectedIds.has(s._id));
        setSelectedIds(new Set());

        setStudents(updatedStudents);
        calculateStats(updatedStudents);
        extractDropdownData(updatedStudents);
        applyFilters(updatedStudents, filters);

        Swal.fire({
          icon: "success",
          title: "সফল!",
          text: `${count}টি রেকর্ড ডিলিট হয়েছে!`,
          confirmButtonColor: "#3b82f6",
        });
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire({
          icon: "error",
          title: "ত্রুটি!",
          text: "রেকর্ড ডিলিট করতে ব্যর্থ হয়েছে",
          confirmButtonColor: "#3b82f6",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "নিশ্চিত করুন",
      text: "এই রেকর্ড ডিলিট করবেন?",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "হ্যাঁ, ডিলিট করুন",
      cancelButtonText: "বাতিল",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}?id=${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          const updatedStudents = students.filter((s) => s._id !== id);
          setStudents(updatedStudents);
          calculateStats(updatedStudents);
          extractDropdownData(updatedStudents);
          applyFilters(updatedStudents, filters);

          Swal.fire({
            icon: "success",
            title: "সফল!",
            text: "রেকর্ড ডিলিট হয়েছে!",
            confirmButtonColor: "#3b82f6",
          });
        }
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire({
          icon: "error",
          title: "ত্রুটি!",
          text: "রেকর্ড ডিলিট করতে ব্যর্থ হয়েছে",
          confirmButtonColor: "#3b82f6",
        });
      }
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student._id);
    setFormData(student);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      studentId: "",
      studentName: "",
      section: "",
      batch: "",
      department: "",
      courseName: "",
      teacherName: "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const dataToSend = { ...formData };

      if (dataToSend.createDate?.includes("-")) {
        const parts = dataToSend.createDate.split("-");
        dataToSend.createDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}?id=${editingId}` : API_URL;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setShowModal(false);
        const newStudentData = await response.json();
        const currentStudentsList = editingId
          ? students.map((s) =>
              s._id === editingId ? ({ ...s, ...dataToSend } as Student) : s
            )
          : [...students, { _id: newStudentData.id, ...dataToSend } as Student];

        setStudents(currentStudentsList);
        calculateStats(currentStudentsList);
        extractDropdownData(currentStudentsList);
        applyFilters(currentStudentsList, filters);

        Swal.fire({
          icon: "success",
          title: "সফল!",
          text: editingId ? "আপডেট হয়েছে!" : "যোগ করা হয়েছে!",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "ত্রুটি!",
          text: errorData.message || "কিছু সমস্যা হয়েছে",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      Swal.fire({
        icon: "error",
        title: "ত্রুটি!",
        text: `Error: ${errorMessage}`,
        confirmButtonColor: "#3b82f6",
      });
    }
  };

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
      <div className="mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">📊 Admin Dashboard</h1>
              <p className="text-gray-400">
                Student Cover Page Management System
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700 transition font-bold disabled:bg-gray-600"
            >
              {isRefreshing ? "⟳ Refreshing..." : "⟳ Refresh Data"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg">
            <div className="text-gray-200 text-sm mb-2">Total Prints</div>
            <div className="text-3xl font-bold">{totalPrints}</div>
          </div>
          <div className="bg-green-600 p-6 rounded-lg">
            <div className="text-gray-200 text-sm mb-2">
              Today&apos;s Prints
            </div>
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

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">📈 Monthly Prints Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="prints"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
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
                  contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                />
                <Legend />
                <Bar dataKey="prints" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mb-8">
          <AnalyticsChart />
        </div>
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-bold mb-4">🔍 Filter Data</h3>
          <div className="grid grid-cols-5 gap-4 mb-4">
            <input
              type="text"
              placeholder="Student ID"
              value={filters.studentId}
              onChange={(e) => handleFilterChange("studentId", e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white placeholder-gray-400"
            />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white"
            />
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white"
            >
              <option value="All Departments">All Departments</option>
              {departmentList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange("section", e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white"
            >
              <option value="All Sections">All Sections</option>
              {sectionList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <button
              onClick={handleResetFilters}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Reset
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <select
              value={searchType}
              onChange={(e) =>
                setSearchType(e.target.value as "name" | "studentId" | "course")
              }
              className="bg-gray-700 px-4 py-2 rounded text-white"
            >
              <option value="name">Search by Name</option>
              <option value="studentId">Search by Student ID</option>
              <option value="course">Search by Course</option>
            </select>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 px-4 py-2 rounded text-white placeholder-gray-400 col-span-2"
            />
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
              className="bg-gray-700 px-4 py-2 rounded text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <button
              onClick={handleAddNew}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition font-bold"
            >
              + Add New
            </button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-yellow-900 p-4 rounded-lg mb-6 flex items-center justify-between">
            <div className="text-white">
              <strong>{selectedIds.size}টি রেকর্ড নির্বাচিত</strong>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteSelected}
                className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition font-bold"
              >
                নির্বাচিত ডিলিট করুন
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                বাতিল করুন
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === paginatedStudents.length &&
                        paginatedStudents.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left">Student ID</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Section</th>
                  <th className="px-6 py-3 text-left">Batch</th>
                  <th className="px-6 py-3 text-left">Course</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student, idx) => (
                  <tr
                    key={student._id}
                    className={idx % 2 === 0 ? "bg-gray-800" : "bg-gray-750"}
                  >
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student._id)}
                        onChange={() => toggleSelect(student._id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-3">{student.studentId}</td>
                    <td className="px-6 py-3">
                      {student.studentName || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-sm">{student.department}</td>
                    <td className="px-6 py-3 text-sm">
                      {student.section || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {student.batch || "old"}
                    </td>
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

          <div className="px-6 py-4 bg-gray-700 text-gray-300 flex items-center justify-between">
            <div>
              Page {currentPage} of {totalPages} | Total Records:{" "}
              {filteredStudents.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? "Edit Student" : "Add New Student"}
              </h2>

              <input
                type="number"
                placeholder="Student ID"
                value={formData.studentId}
                onChange={(e) =>
                  setFormData({ ...formData, studentId: e.target.value })
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
                placeholder="Batch"
                value={formData.batch || ""}
                onChange={(e) =>
                  setFormData({ ...formData, batch: e.target.value })
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
                className="w-full bg-gray-700 px-4 py-2 rounded mb-3 text-white placeholder-gray-400"
              />
              <input
                type="date"
                value={formData.createDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, createDate: e.target.value })
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
