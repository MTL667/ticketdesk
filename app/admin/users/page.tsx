"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface UserSummary {
  email: string;
  total: number;
  statuses: Record<string, number>;
}

interface Ticket {
  id: string;
  ticketId: string | null;
  name: string;
  status: string;
  priority: string | null;
  app: string | null;
  businessUnit: string | null;
  jiraStatus: string | null;
  jiraAssignee: string | null;
  jiraUrl: string | null;
  clickupCreatedAt: string;
  clickupUpdatedAt: string;
  dueDate: string | null;
}

interface UserDetail {
  email: string;
  total: number;
  statuses: Record<string, number>;
  tickets: Ticket[];
}

type SortKey = "ticketId" | "name" | "status" | "priority" | "app" | "clickupCreatedAt";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("complete") || s.includes("closed")) return "bg-green-100 text-green-700";
  if (s.includes("progress") || s.includes("doing") || s.includes("development")) return "bg-purple-100 text-purple-700";
  if (s.includes("waiting") || s.includes("pending") || s.includes("review")) return "bg-yellow-100 text-yellow-700";
  if (s.includes("new") || s.includes("open") || s.includes("to do")) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("nl-BE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("clickupCreatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const t = (nl: string, fr: string, en: string) =>
    language === "nl" ? nl : language === "fr" ? fr : en;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "clickupCreatedAt" ? "desc" : "asc");
    }
  };

  const sortedTickets = (() => {
    if (!selected) return [];
    const copy = [...selected.tickets];
    copy.sort((a, b) => {
      let av: unknown = a[sortKey];
      let bv: unknown = b[sortKey];

      if (sortKey === "priority") {
        av = PRIORITY_ORDER[(a.priority || "").toLowerCase()] ?? 999;
        bv = PRIORITY_ORDER[(b.priority || "").toLowerCase()] ?? 999;
      } else if (sortKey === "clickupCreatedAt") {
        av = new Date(a.clickupCreatedAt).getTime();
        bv = new Date(b.clickupCreatedAt).getTime();
      }

      const result = compareValues(av, bv);
      return sortDir === "asc" ? result : -result;
    });
    return copy;
  })();

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

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
      if (!data.isAdmin) {
        redirect("/");
      } else {
        fetchUsers("");
      }
    } catch {
      redirect("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (query: string) => {
    setLoadingUsers(true);
    try {
      const url = query
        ? `/api/admin/users?search=${encodeURIComponent(query)}`
        : `/api/admin/users`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserDetail = async (email: string) => {
    setLoadingDetail(true);
    setSelected(null);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(email)}/tickets`
      );
      if (response.ok) {
        const data = await response.json();
        setSelected(data);
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error fetching user detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const downloadCsv = (email: string) => {
    window.location.href = `/api/admin/users/${encodeURIComponent(email)}/export`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">{t("Laden...", "Chargement...", "Loading...")}</div>
      </div>
    );
  }

  if (!session || !isAdminUser) {
    return null;
  }

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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("Gebruikersbeheer", "Gestion des utilisateurs", "User management")}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {t(
            "Zoek een gebruiker op e-mail, bekijk hun tickets en exporteer naar CSV.",
            "Recherchez un utilisateur par e-mail, consultez ses tickets et exportez en CSV.",
            "Look up a user by email, view their tickets and export as CSV."
          )}
        </p>

        <div className={`grid grid-cols-1 gap-6 ${sidebarOpen ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
          {/* Left: search + list (collapsible) */}
          {sidebarOpen && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("Zoek e-mail...", "Rechercher e-mail...", "Search email...")}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      {t("Zoek", "Chercher", "Search")}
                    </button>
                  </form>
                  {selected && (
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                      title={t("Verbergen", "Masquer", "Hide")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  {users.length} {t("gebruiker(s)", "utilisateur(s)", "user(s)")}
                </div>

                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {loadingUsers ? (
                    <div className="text-center py-4 text-gray-400 text-sm animate-pulse">
                      {t("Laden...", "Chargement...", "Loading...")}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {t("Geen gebruikers gevonden", "Aucun utilisateur trouvé", "No users found")}
                    </div>
                  ) : (
                    users.map((user) => (
                      <button
                        key={user.email}
                        onClick={() => loadUserDetail(user.email)}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                          selected?.email === user.email ? "bg-blue-50 border border-blue-200" : ""
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          {user.total} {t("tickets", "tickets", "tickets")}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right: detail */}
          <div className={sidebarOpen ? "lg:col-span-2" : "lg:col-span-1"}>
            {!sidebarOpen && (
              <div className="mb-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700"
                >
                  🔍 {t("Andere gebruiker zoeken", "Chercher un autre utilisateur", "Search another user")}
                </button>
              </div>
            )}
            {loadingDetail ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-400 animate-pulse">
                {t("Laden...", "Chargement...", "Loading...")}
              </div>
            ) : !selected ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500 mb-1">👤</p>
                <p className="text-gray-600">
                  {t(
                    "Selecteer een gebruiker om hun tickets te bekijken",
                    "Sélectionnez un utilisateur pour voir ses tickets",
                    "Select a user to view their tickets"
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header with stats and export */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selected.email}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {selected.total} {t("tickets totaal", "tickets au total", "tickets total")}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadCsv(selected.email)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium inline-flex items-center gap-2"
                    >
                      ⬇ {t("Export CSV", "Exporter CSV", "Export CSV")}
                    </button>
                  </div>

                  {/* Status breakdown */}
                  {Object.keys(selected.statuses).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(selected.statuses)
                        .sort((a, b) => b[1] - a[1])
                        .map(([status, count]) => (
                          <span
                            key={status}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(status)}`}
                          >
                            {status}: {count}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Ticket table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {selected.tickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {t("Geen tickets gevonden", "Aucun ticket trouvé", "No tickets found")}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              onClick={() => toggleSort("ticketId")}
                              className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs cursor-pointer hover:bg-gray-100 select-none"
                            >
                              {t("Ticket", "Ticket", "Ticket")}
                              {sortArrow("ticketId")}
                            </th>
                            <th
                              onClick={() => toggleSort("name")}
                              className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs cursor-pointer hover:bg-gray-100 select-none"
                            >
                              {t("Naam", "Nom", "Name")}
                              {sortArrow("name")}
                            </th>
                            <th
                              onClick={() => toggleSort("status")}
                              className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs cursor-pointer hover:bg-gray-100 select-none"
                            >
                              {t("Status", "Statut", "Status")}
                              {sortArrow("status")}
                            </th>
                            <th
                              onClick={() => toggleSort("priority")}
                              className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs cursor-pointer hover:bg-gray-100 select-none"
                            >
                              {t("Prioriteit", "Priorité", "Priority")}
                              {sortArrow("priority")}
                            </th>
                            <th
                              onClick={() => toggleSort("app")}
                              className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs cursor-pointer hover:bg-gray-100 select-none"
                            >
                              App
                              {sortArrow("app")}
                            </th>
                            <th
                              onClick={() => toggleSort("clickupCreatedAt")}
                              className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs cursor-pointer hover:bg-gray-100 select-none"
                            >
                              {t("Aangemaakt", "Créé", "Created")}
                              {sortArrow("clickupCreatedAt")}
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">
                              {t("Open", "Ouvrir", "Open")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sortedTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 font-mono text-xs">
                                <a
                                  href={`https://app.clickup.com/t/${ticket.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 hover:text-blue-900 hover:underline"
                                  title={t("Open in ClickUp", "Ouvrir dans ClickUp", "Open in ClickUp")}
                                >
                                  {ticket.ticketId || ticket.id.slice(0, 8)}
                                </a>
                              </td>
                              <td className="px-4 py-2 text-gray-900 max-w-xs truncate" title={ticket.name}>
                                {ticket.name}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(ticket.status)}`}>
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-gray-600 capitalize">{ticket.priority || "-"}</td>
                              <td className="px-4 py-2 text-gray-600">{ticket.app || "-"}</td>
                              <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                                {formatDate(ticket.clickupCreatedAt)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`https://app.clickup.com/t/${ticket.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                                    title={t("Open in ClickUp", "Ouvrir dans ClickUp", "Open in ClickUp")}
                                  >
                                    ClickUp ↗
                                  </a>
                                  {ticket.jiraUrl && (
                                    <a
                                      href={ticket.jiraUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 font-medium"
                                      title={t("Open in Jira", "Ouvrir dans Jira", "Open in Jira")}
                                    >
                                      Jira ↗
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
