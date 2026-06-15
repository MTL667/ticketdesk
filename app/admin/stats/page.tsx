"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

type View = "month" | "quarter" | "year";

interface StatsData {
  current: { total: number; statuses: Record<string, number> };
  trend: { label: string; total: number; statuses: Record<string, number> }[];
  topCreators: { email: string; name: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  done: "#22c55e",
  complete: "#22c55e",
  closed: "#22c55e",
  progress: "#a855f7",
  doing: "#a855f7",
  development: "#a855f7",
  waiting: "#eab308",
  pending: "#eab308",
  review: "#eab308",
  new: "#3b82f6",
  open: "#3b82f6",
  "to do": "#3b82f6",
};

const FALLBACK_COLORS = [
  "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#ef4444",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#8b5cf6",
];

function getStatusColor(status: string, index: number): string {
  const s = status.toLowerCase();
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (s.includes(key)) return color;
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function statusBadgeColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("complete") || s.includes("closed")) return "bg-green-100 text-green-700";
  if (s.includes("progress") || s.includes("doing") || s.includes("development")) return "bg-purple-100 text-purple-700";
  if (s.includes("waiting") || s.includes("pending") || s.includes("review")) return "bg-yellow-100 text-yellow-700";
  if (s.includes("new") || s.includes("open") || s.includes("to do")) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

function formatPeriodLabel(view: View, period: string, language: string): string {
  if (view === "month") {
    const [y, m] = period.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1);
    const locale = language === "nl" ? "nl-BE" : language === "fr" ? "fr-BE" : "en-US";
    return date.toLocaleDateString(locale, { year: "numeric", month: "long" });
  }
  if (view === "quarter") return period.replace("-", " ");
  return period;
}

function getCurrentPeriod(view: View): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  if (view === "month") return `${y}-${m}`;
  if (view === "quarter") return `${y}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  return `${y}`;
}

function shiftPeriod(view: View, period: string, delta: number): string {
  if (view === "month") {
    const [y, m] = period.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (view === "quarter") {
    const match = period.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return period;
    let y = parseInt(match[1]);
    let q = parseInt(match[2]) + delta;
    while (q < 1) { y--; q += 4; }
    while (q > 4) { y++; q -= 4; }
    return `${y}-Q${q}`;
  }
  return `${parseInt(period) + delta}`;
}

export default function AdminStatsPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>("month");
  const [period, setPeriod] = useState(() => getCurrentPeriod("month"));
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const t = (nl: string, fr: string, en: string) =>
    language === "nl" ? nl : language === "fr" ? fr : en;

  useEffect(() => {
    if (status === "authenticated") {
      checkAdmin();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status]);

  const checkAdmin = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();
      setIsAdminUser(data.isAdmin);
      if (!data.isAdmin) redirect("/");
    } catch {
      redirect("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats?view=${view}&period=${encodeURIComponent(period)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.current?.statuses || !Array.isArray(data.trend) || !Array.isArray(data.topCreators)) {
        throw new Error("Invalid response shape");
      }
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("fetch-error");
    } finally {
      setLoadingStats(false);
    }
  }, [view, period]);

  useEffect(() => {
    if (isAdminUser) fetchStats();
  }, [isAdminUser, fetchStats]);

  const handleViewChange = (newView: View) => {
    setView(newView);
    setPeriod(getCurrentPeriod(newView));
  };

  const statusEntries = stats
    ? Object.entries(stats.current.statuses).sort((a, b) => b[1] - a[1])
    : [];

  const donutData = statusEntries.map(([name, value]) => ({ name, value }));

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">{t("Laden...", "Chargement...", "Loading...")}</div>
      </div>
    );
  }

  if (!session || !isAdminUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
              ServiceDesk
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">ADMIN</span>
              <LanguageSelector />
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <Link href="/api/auth/signout" className="text-sm text-blue-600 hover:text-blue-800">
                {t("Uitloggen", "Déconnexion", "Logout")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1">
            ← {t("Terug naar admin", "Retour admin", "Back to admin")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("Ticket Statistieken", "Statistiques des tickets", "Ticket Statistics")}
        </h1>

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(["month", "quarter", "year"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    view === v
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {v === "month"
                    ? t("Maand", "Mois", "Month")
                    : v === "quarter"
                      ? t("Kwartaal", "Trimestre", "Quarter")
                      : t("Jaar", "Année", "Year")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPeriod(shiftPeriod(view, period, -1))}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                ◂
              </button>
              <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
                {formatPeriodLabel(view, period, language)}
              </span>
              <button
                onClick={() => setPeriod(shiftPeriod(view, period, 1))}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                ▸
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
            {t("Statistieken laden mislukt", "Échec du chargement des statistiques", "Failed to load statistics")}
          </div>
        )}

        {loadingStats && !stats ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-pulse text-gray-500">{t("Laden...", "Chargement...", "Loading...")}</div>
          </div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 col-span-2 lg:col-span-1">
                <div className="text-xs text-gray-500 font-medium uppercase">
                  {t("Totaal", "Total", "Total")}
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{stats.current.total}</div>
              </div>
              {statusEntries.slice(0, 5).map(([status, count]) => (
                <div key={status} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 font-medium uppercase truncate" title={status}>
                    {status}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{count}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {stats.current.total > 0
                      ? `${((count / stats.current.total) * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
              ))}
            </div>

            {/* Donut + Trend/Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Donut Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  {t("Statusverdeling", "Répartition des statuts", "Status Distribution")}
                </h2>
                {donutData.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                    {t("Geen data", "Pas de données", "No data")}
                  </div>
                ) : (
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                          cursor="pointer"
                          onClick={(entry) => {
                            if (entry?.name) {
                              router.push(`/admin/users?search=&status=${encodeURIComponent(entry.name)}`);
                            }
                          }}
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={entry.name} fill={getStatusColor(entry.name, index)} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => {
                            const v = Number(value);
                            return [
                              `${v} (${stats.current.total > 0 ? ((v / stats.current.total) * 100).toFixed(1) : 0}%)`,
                              String(name),
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center total */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{stats.current.total}</div>
                        <div className="text-xs text-gray-500">{t("totaal", "total", "total")}</div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Legend */}
                <div className="mt-2 flex flex-wrap gap-2 justify-center">
                  {donutData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs text-gray-600">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStatusColor(entry.name, index) }}
                      />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend / Table Toggle */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">
                    {t("Trend", "Tendance", "Trend")}
                  </h2>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setShowTable(false)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        !showTable ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t("Grafiek", "Graphique", "Chart")}
                    </button>
                    <button
                      onClick={() => setShowTable(true)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        showTable ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t("Tabel", "Tableau", "Table")}
                    </button>
                  </div>
                </div>

                {stats.trend.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                    {t("Geen data", "Pas de données", "No data")}
                  </div>
                ) : !showTable ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={stats.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name={t("Totaal", "Total", "Total")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ComparisonTable
                    trend={stats.trend}
                    view={view}
                    t={t}
                  />
                )}
              </div>
            </div>

            {/* Top Creators */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                {t("Top Ticket Creators", "Top créateurs de tickets", "Top Ticket Creators")}
              </h2>
              {stats.topCreators.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {t("Geen data", "Pas de données", "No data")}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, stats.topCreators.length * 40)}>
                  <BarChart data={stats.topCreators} layout="vertical" margin={{ left: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={110}
                    />
                    <Tooltip
                      formatter={(value) => [Number(value), t("Tickets", "Tickets", "Tickets")]}
                      labelFormatter={(label) => {
                        const creator = stats.topCreators.find((c) => c.name === String(label));
                        return creator?.email || String(label);
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function ComparisonTable({
  trend,
  view,
  t,
}: {
  trend: StatsData["trend"];
  view: View;
  t: (nl: string, fr: string, en: string) => string;
}) {
  const allStatuses = Array.from(
    new Set(trend.flatMap((p) => Object.keys(p.statuses)))
  ).sort();

  const showYearTotal = view === "year";
  const yearTotals: Record<string, number> = {};
  let yearGrandTotal = 0;

  if (showYearTotal) {
    for (const p of trend) {
      yearGrandTotal += p.total;
      for (const [status, count] of Object.entries(p.statuses)) {
        yearTotals[status] = (yearTotals[status] || 0) + count;
      }
    }
  }

  const getDelta = (current: number, previous: number): { text: string; color: string } => {
    if (previous === 0) return { text: "", color: "" };
    const diff = current - previous;
    const pct = ((diff / previous) * 100).toFixed(0);
    if (diff > 0) return { text: `+${pct}%`, color: "text-red-500" };
    if (diff < 0) return { text: `${pct}%`, color: "text-green-500" };
    return { text: "0%", color: "text-gray-400" };
  };

  return (
    <div className="overflow-x-auto max-h-[280px]">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
              {t("Status", "Statut", "Status")}
            </th>
            {trend.map((p, i) => (
              <th key={p.label} className="px-3 py-2 text-right font-medium text-gray-500 uppercase">
                {p.label}
                {i > 0 && <span className="block text-[10px] text-gray-400">Δ</span>}
              </th>
            ))}
            {showYearTotal && (
              <th className="px-3 py-2 text-right font-semibold text-gray-700 uppercase bg-blue-50">
                {t("Jaar Totaal", "Total Annuel", "Year Total")}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr className="font-semibold bg-gray-50">
            <td className="px-3 py-2 text-gray-700">{t("Totaal", "Total", "Total")}</td>
            {trend.map((p, i) => {
              const delta = i > 0 ? getDelta(p.total, trend[i - 1].total) : null;
              return (
                <td key={p.label} className="px-3 py-2 text-right text-gray-900">
                  {p.total}
                  {delta && delta.text && (
                    <span className={`block text-[10px] ${delta.color}`}>{delta.text}</span>
                  )}
                </td>
              );
            })}
            {showYearTotal && (
              <td className="px-3 py-2 text-right text-gray-900 bg-blue-50 font-bold">{yearGrandTotal}</td>
            )}
          </tr>
          {allStatuses.map((status) => (
            <tr key={status} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadgeColor(status)}`}>
                  {status}
                </span>
              </td>
              {trend.map((p, i) => {
                const val = p.statuses[status] || 0;
                const prev = i > 0 ? (trend[i - 1].statuses[status] || 0) : 0;
                const delta = i > 0 ? getDelta(val, prev) : null;
                return (
                  <td key={p.label} className="px-3 py-2 text-right text-gray-700">
                    {val}
                    {delta && delta.text && (
                      <span className={`block text-[10px] ${delta.color}`}>{delta.text}</span>
                    )}
                  </td>
                );
              })}
              {showYearTotal && (
                <td className="px-3 py-2 text-right text-gray-900 bg-blue-50 font-semibold">
                  {yearTotals[status] || 0}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
