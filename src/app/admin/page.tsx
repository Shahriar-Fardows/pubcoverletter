"use client";

import AnalyticsChart from "@/components/analytics-chart/analyticsChart";
import BlockedStudentsPage from "@/components/blocked-students/blockedStudents";
import StudentFilter from "@/components/student-filter/studentFilter";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import Swal from "sweetalert2";
import { LayoutDashboard, Users, Printer, CalendarDays, RefreshCw, BarChart3, Activity, FileText } from "lucide-react";
import ResumeAnalytics from "@/components/resume-analytics/resumeAnalytics";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [totalPrints, setTotalPrints] = useState(0);
  const [todayPrints, setTodayPrints] = useState(0);
  const [uniqueStudents, setUniqueStudents] = useState(0);

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthPrints, setCurrentMonthPrints] = useState(0);
  const [currentMonthName, setCurrentMonthName] = useState("");

  const [activeTab, setActiveTab] = useState<"overview" | "students" | "blocked" | "analytics" | "resumes">("overview");

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch");
      
      const jsonData = await response.json();
      
      // API returns {total, data: [...]}
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
        background: "#1e293b",
        color: "#f8fafc"
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

    // Today's prints safely formatted as DD/MM/YYYY
    const dDate = new Date();
    const today = `${String(dDate.getDate()).padStart(2, "0")}/${String(dDate.getMonth() + 1).padStart(2, "0")}/${dDate.getFullYear()}`;
    const todayCount = data.filter((d) => d.createDate === today).length;
    setTodayPrints(todayCount);

    // Unique students
    const uniqueIds = new Set(data.map((d) => d.studentId).filter(id => id));
    setUniqueStudents(uniqueIds.size);

    // Daily data aggregation for charts
    const dayMap: Record<string, number> = {};
    data.forEach((d) => {
      if (d.createDate) {
        dayMap[d.createDate] = (dayMap[d.createDate] || 0) + 1;
      }
    });

    const dailyArray: MonthlyData[] = Object.entries(dayMap)
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

    setMonthlyData(dailyArray.slice(-14)); // Last 14 active days for cleaner chart

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const currentDate = new Date();
    setCurrentMonthName(monthNames[currentDate.getMonth()]);

    const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentYearStr = String(currentDate.getFullYear());
    
    let currentMonthTotal = 0;
    data.forEach(d => {
      if (d.createDate) {
        const parts = d.createDate.split("/");
        if (parts.length === 3 && parts[1] === currentMonthStr && parts[2] === currentYearStr) {
          currentMonthTotal++;
        }
      }
    });

    setCurrentMonthPrints(currentMonthTotal);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0f172a] text-white">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-blue-500"></div>
          <p className="mt-4 text-lg font-medium tracking-widest text-blue-400">CONNECTING TO MATRIX...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "students", label: "Student Data", icon: Users },
    { id: "blocked", label: "Blocked Access", icon: Activity },
    { id: "analytics", label: "Web Analytics", icon: BarChart3 },
    { id: "resumes", label: "Resume Stats", icon: FileText },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
                <Printer className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
                Cover<span className="text-blue-500">Dash</span> Admin
              </h1>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                      isActive 
                        ? "bg-blue-600/10 text-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-blue-500/20" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50 sm:h-auto sm:w-auto sm:px-4 sm:gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-400" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              <span className="hidden sm:inline font-medium">Sync Data</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-white">System Overview</h2>
              <p className="text-slate-400 mt-1">Real-time statistics and print distribution insights.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 p-6 shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Printer className="h-24 w-24" />
                </div>
                <p className="text-sm font-medium text-slate-400">Total Cover Prints</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">{totalPrints}</span>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">All time</span>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-900/40 to-slate-900 border border-blue-800/50 p-6 shadow-xl shadow-blue-900/20">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-300">
                  <CalendarDays className="h-24 w-24" />
                </div>
                <p className="text-sm font-medium text-blue-400">Today&apos;s Prints</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">{todayPrints}</span>
                  <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">New</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 p-6 shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Users className="h-24 w-24" />
                </div>
                <p className="text-sm font-medium text-slate-400">Unique Students</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">{uniqueStudents}</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-purple-900/30 to-slate-900 border border-purple-800/40 p-6 shadow-xl shadow-purple-900/10">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-300">
                  <Activity className="h-24 w-24" />
                </div>
                <p className="text-sm font-medium text-purple-400">Prints in {currentMonthName}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">{currentMonthPrints}</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Daily Print Trajectory</h3>
                    <p className="text-xs text-slate-400">Last 14 active days trendline</p>
                  </div>
                </div>
                
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrints" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#f1f5f9", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                        itemStyle={{ color: "#60a5fa" }}
                      />
                      <Area type="monotone" dataKey="prints" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrints)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Print Volume Distribution</h3>
                    <p className="text-xs text-slate-400">Visual comparison by day</p>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#f1f5f9", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                        cursor={{ fill: '#1e293b' }}
                      />
                      <Bar dataKey="prints" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDENTS FILTER TAB */}
        {activeTab === "students" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-white">Student Database</h2>
              <p className="text-slate-400 mt-1">Manage, filter, and track individually printed covers.</p>
            </div>
            {/* The actual filter component which will also be revamped */}
            <StudentFilter />
          </div>
        )}

        {/* BLOCKED ACCESS TAB */}
        {activeTab === "blocked" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-white">Security & Access</h2>
              <p className="text-slate-400 mt-1">Manage network blocks and malicious access attempts.</p>
            </div>
            <BlockedStudentsPage />
          </div>
        )}

        {/* WEBSITE ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-white">Traffic Analytics</h2>
              <p className="text-slate-400 mt-1">Understand platform reach and visitor trends over time.</p>
            </div>
            <AnalyticsChart />
          </div>
        )}

        {/* RESUME ANALYTICS TAB */}
        {activeTab === "resumes" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-white">Resume Generation Logs</h2>
              <p className="text-slate-400 mt-1">Track usage of the Resume Builder tool across students.</p>
            </div>
            <ResumeAnalytics />
          </div>
        )}

      </main>
    </div>
  );
}