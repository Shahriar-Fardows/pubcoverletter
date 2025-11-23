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
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">🌐 Website Views Analytics</h3>
          <p className="text-xs text-gray-400">
            Custom MongoDB based tracking
          </p>
        </div>
        <div className="flex gap-2">
          {(["daily", "monthly", "yearly"] as TabKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                activeTab === key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {tabLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-400">Loading analytics data…</div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-900/40 border border-red-700 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-3 text-xs text-gray-300 flex items-center justify-between">
            <span>
              Showing <span className="font-semibold">{tabLabels[activeTab]}</span>
            </span>
            <span>
              Total views: <span className="font-semibold">{totalViews}</span>
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
