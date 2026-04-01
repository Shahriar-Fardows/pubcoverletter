"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RawRecord = {
  type: "daily" | "monthly" | "yearly";
  path: string;
  date: string; // "2025-01-22" / "2025-01" / "2025"
  views: number;
};

type ChartPoint = {
  label: string;
  views: number;
};

type TabKey = "daily" | "monthly" | "yearly";

async function fetchAnalytics(url: string): Promise<RawRecord[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

// all path mila ekta date er total views
function aggregateByDate(data: RawRecord[]): ChartPoint[] {
  const map = new Map<string, number>();

  data.forEach((item) => {
    const current = map.get(item.date) ?? 0;
    map.set(item.date, current + (item.views ?? 0));
  });

  return Array.from(map.entries())
    .map(([label, views]) => ({ label, views }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const tabLabels: Record<TabKey, string> = {
  daily: "Daily Views",
  monthly: "Monthly Views",
  yearly: "Yearly Views",
};

export default function AnalyticsChart() {
  const [activeTab, setActiveTab] = useState<TabKey>("daily");
  const [daily, setDaily] = useState<ChartPoint[]>([]);
  const [monthly, setMonthly] = useState<ChartPoint[]>([]);
  const [yearly, setYearly] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dailyRaw, monthlyRaw, yearlyRaw] = await Promise.all([
          fetchAnalytics("/api/analytics/daily"),
          fetchAnalytics("/api/analytics/monthly"),
          fetchAnalytics("/api/analytics/yearly"),
        ]);

        setDaily(aggregateByDate(dailyRaw));
        setMonthly(aggregateByDate(monthlyRaw));
        setYearly(aggregateByDate(yearlyRaw));
      } catch (err) {
        console.error(err);
        setError("Analytics data load korte problem hocche.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const getActiveData = () => {
    if (activeTab === "daily") return daily;
    if (activeTab === "monthly") return monthly;
    return yearly;
  };

  const activeData = getActiveData();

  const totalViews = activeData.reduce((sum, d) => sum + d.views, 0);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">🌐 Website Views Analytics</h3>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Core MongoDB tracking
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800">
          {(["daily", "monthly", "yearly"] as TabKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tabLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex h-32 items-center justify-center text-sm text-blue-400">
           <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mr-3"></div> Loading analytics data…
        </div>
      )}

      {error && (
        <div className="text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-4 text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>
              Showing <span className="font-bold text-blue-400">{tabLabels[activeTab]}</span>
            </span>
            <span className="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700/50">
              Total views: <span className="font-bold text-white">{totalViews}</span>
            </span>
          </div>

          <div className="h-72">
            {activeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                এখনো কোনো analytics data নাই। User ra website e gele data আসবে।
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === "daily" ? (
                  <LineChart data={activeData}>
                    <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "0.375rem",
                        color: "#e5e7eb",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 2, fill: "#3b82f6" }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={activeData}>
                    <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "0.375rem",
                        color: "#e5e7eb",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="views" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
