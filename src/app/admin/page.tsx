"use client";

import AnalyticsChart from "@/components/analytics-chart/analyticsChart";
import BlockedStudentsPage from "@/components/blocked-students/blockedStudents";
import StudentFilter from "@/components/student-filter/studentFilter";
import { useState, useEffect } from "react";
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
import Swal from "sweetalert2";

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

interface MonthlyData {
  date: string;
  prints: number;
}

export default function AdminPortal() {
  const API_URL = "/api/students";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [totalPrints, setTotalPrints] = useState(0);
  const [todayPrints, setTodayPrints] = useState(0);
  const [uniqueStudents, setUniqueStudents] = useState(0);

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthPrints, setCurrentMonthPrints] = useState(0);
  const [currentMonthName, setCurrentMonthName] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      
      const jsonData = await response.json();
      
      // ✅ আপনার API returns {total, data: [...]}
      const studentData: Student[] = jsonData.data || [];
      
      setStudents(studentData);
      calculateStats(studentData);
    } catch (err) {
      console.error("Fetch error:", err);
      Swal.fire({
        icon: "error",
        title: "ডেটা লোড করতে ব্যর্থ",
        text: "সার্ভার থেকে ডেটা আনতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setIsRefreshing(false);
  };

  const calculateStats = (data: Student[]) => {
    setTotalPrints(data.length);

    // Today's prints
    const today = new Date().toLocaleDateString("en-GB");
    const todayCount = data.filter((d) => d.createDate === today).length;
    setTodayPrints(todayCount);

    // Unique students
    const uniqueIds = new Set(data.map((d) => d.studentId));
    setUniqueStudents(uniqueIds.size);

    // Monthly data
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
          const dateA = new Date(a.date.split("/").reverse().join("-")).getTime();
          const dateB = new Date(b.date.split("/").reverse().join("-")).getTime();
          return dateA - dateB;
        } catch {
          return 0;
        }
      });

    setMonthlyData(monthlyArray);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const currentDate = new Date();
    setCurrentMonthName(monthNames[currentDate.getMonth()]);

    const currentMonthData = monthlyArray[monthlyArray.length - 1];
    setCurrentMonthPrints(currentMonthData?.prints || 0);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-lg bg-gray-900 min-h-screen text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">📊 Admin Dashboard</h1>
              <p className="text-gray-400">Student Cover Page Management System</p>
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

        {/* Top stats cards */}
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

        {/* Prints charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">📈 Monthly Prints Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} />
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
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} />
                <Legend />
                <Bar dataKey="prints" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
       {/* Website analytics (custom tracker) */}
        <div className="mb-8">
          <AnalyticsChart />
        </div>
        <div className="mb-8">
          <BlockedStudentsPage />
        </div>
        <div className="my-8">
          <StudentFilter />
        </div>
    </div>
  );
}