"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface MessageSummary {
  msg_id: string;
  from_email: string;
  subject: string;
  to_email: string;
  status: string;
  opens_count?: number;
  clicks_count?: number;
  last_event_time: string;
}

interface SendGridEvent {
  event_name: string;
  processed: string;
  reason?: string;
  attempt_num?: number;
  url?: string;
  ip?: string;
  mx_server?: string;
  bounce_classification?: string;
  http_user_agent?: string;
}

interface MessageDetail extends MessageSummary {
  events?: SendGridEvent[];
  categories?: string[];
  outbound_ip?: string;
  template_id?: string;
}

type SuppressionType = "bounces" | "blocks" | "invalid_emails" | "spam_reports";

interface SuppressionEntry {
  email: string;
  created: number;
  reason?: string;
  status?: string;
}

interface SuppressionStatus {
  email: string;
  bounces: SuppressionEntry | null;
  blocks: SuppressionEntry | null;
  invalid_emails: SuppressionEntry | null;
  spam_reports: SuppressionEntry | null;
}

const SUPPRESSION_LABELS: Record<SuppressionType, { nl: string; fr: string; en: string; color: string }> = {
  bounces: { nl: "Bounces", fr: "Bounces", en: "Bounces", color: "bg-red-100 text-red-700 border-red-300" },
  blocks: { nl: "Blocks", fr: "Blocks", en: "Blocks", color: "bg-orange-100 text-orange-700 border-orange-300" },
  invalid_emails: { nl: "Ongeldige e-mails", fr: "E-mails invalides", en: "Invalid emails", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  spam_reports: { nl: "Spamrapporten", fr: "Signalements spam", en: "Spam reports", color: "bg-purple-100 text-purple-700 border-purple-300" },
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("nl-BE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "delivered") return "bg-green-100 text-green-700";
  if (s === "processed") return "bg-blue-100 text-blue-700";
  if (s === "not_delivered") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

function eventColor(eventName: string): string {
  const e = eventName.toLowerCase();
  if (e === "delivered") return "bg-green-100 text-green-700 border-green-300";
  if (e === "open") return "bg-blue-100 text-blue-700 border-blue-300";
  if (e === "click") return "bg-indigo-100 text-indigo-700 border-indigo-300";
  if (e === "processed") return "bg-gray-100 text-gray-700 border-gray-300";
  if (e === "bounce" || e === "dropped" || e === "blocked") return "bg-red-100 text-red-700 border-red-300";
  if (e === "deferred") return "bg-yellow-100 text-yellow-700 border-yellow-300";
  if (e === "spam_report" || e === "unsubscribe") return "bg-orange-100 text-orange-700 border-orange-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
}

function eventIcon(eventName: string): string {
  const e = eventName.toLowerCase();
  if (e === "delivered") return "✓";
  if (e === "open") return "👁";
  if (e === "click") return "🔗";
  if (e === "processed") return "⚙";
  if (e === "bounce") return "↩";
  if (e === "dropped") return "✕";
  if (e === "deferred") return "⏸";
  if (e === "spam_report") return "⚠";
  if (e === "unsubscribe") return "🚫";
  if (e === "blocked") return "🛑";
  return "•";
}

export default function AdminEmailPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [days, setDays] = useState(30);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<MessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [suppressions, setSuppressions] = useState<SuppressionStatus | null>(null);
  const [loadingSuppressions, setLoadingSuppressions] = useState(false);
  const [removingType, setRemovingType] = useState<SuppressionType | null>(null);

  // Full suppression list browser
  const [activeTab, setActiveTab] = useState<"search" | "lists">("search");
  const [listType, setListType] = useState<SuppressionType>("bounces");
  const [listEntries, setListEntries] = useState<SuppressionEntry[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listFilter, setListFilter] = useState("");
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const t = (nl: string, fr: string, en: string) =>
    language === "nl" ? nl : language === "fr" ? fr : en;

  useEffect(() => {
    if (status === "authenticated") {
      checkAdmin();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status]);

  useEffect(() => {
    if (activeTab === "lists" && isAdminUser) {
      fetchSuppressionList(listType);
    }
     
  }, [activeTab, listType, isAdminUser]);

  const checkAdmin = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();
      setIsAdminUser(data.isAdmin);
      if (!data.isAdmin) {
        redirect("/");
      }
    } catch {
      redirect("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppressions = async (emailAddr: string) => {
    setLoadingSuppressions(true);
    try {
      const response = await fetch(
        `/api/admin/email/suppressions?email=${encodeURIComponent(emailAddr)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSuppressions(data);
      } else {
        setSuppressions(null);
      }
    } catch (err) {
      console.error("Error fetching suppressions:", err);
      setSuppressions(null);
    } finally {
      setLoadingSuppressions(false);
    }
  };

  const fetchSuppressionList = async (type: SuppressionType) => {
    setLoadingList(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/email/suppressions/list?type=${type}&limit=500`
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Error loading suppression list");
        setListEntries([]);
        return;
      }
      setListEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading suppression list");
      setListEntries([]);
    } finally {
      setLoadingList(false);
    }
  };

  const removeEntryFromList = async (type: SuppressionType, emailAddr: string) => {
    const confirmed = window.confirm(
      t(
        `Weet je zeker dat je ${emailAddr} van de "${SUPPRESSION_LABELS[type].nl}" lijst wilt verwijderen?`,
        `Confirmer la suppression de ${emailAddr} de la liste "${SUPPRESSION_LABELS[type].fr}" ?`,
        `Are you sure you want to remove ${emailAddr} from the "${SUPPRESSION_LABELS[type].en}" list?`
      )
    );
    if (!confirmed) return;

    setRemovingEmail(emailAddr);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/email/suppressions?email=${encodeURIComponent(emailAddr)}&type=${type}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Error removing from suppression list");
        return;
      }
      // Optimistically remove from current list
      setListEntries((prev) => prev.filter((e) => e.email !== emailAddr));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error removing from suppression list");
    } finally {
      setRemovingEmail(null);
    }
  };

  const removeFromSuppression = async (type: SuppressionType) => {
    if (!suppressions) return;
    const emailAddr = suppressions.email;

    const confirmed = window.confirm(
      t(
        `Weet je zeker dat je ${emailAddr} van de "${SUPPRESSION_LABELS[type].nl}" lijst wilt verwijderen?`,
        `Confirmer la suppression de ${emailAddr} de la liste "${SUPPRESSION_LABELS[type].fr}" ?`,
        `Are you sure you want to remove ${emailAddr} from the "${SUPPRESSION_LABELS[type].en}" list?`
      )
    );
    if (!confirmed) return;

    setRemovingType(type);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/email/suppressions?email=${encodeURIComponent(emailAddr)}&type=${type}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Error removing from suppression list");
        return;
      }
      // Refresh suppression status
      await fetchSuppressions(emailAddr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error removing from suppression list");
    } finally {
      setRemovingType(null);
    }
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSearching(true);
    setError(null);
    setMessages([]);
    setSelected(null);
    setSearched(false);
    setSuppressions(null);

    try {
      const trimmed = email.trim();

      // Fire both requests in parallel
      const [activityRes] = await Promise.all([
        fetch(`/api/admin/email?email=${encodeURIComponent(trimmed)}&days=${days}`),
        fetchSuppressions(trimmed),
      ]);

      const data = await activityRes.json();

      if (!activityRes.ok) {
        setError(data.message || "Error searching email activity");
        return;
      }

      setMessages(data.messages || []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error searching email activity");
    } finally {
      setSearching(false);
    }
  };

  const loadDetail = async (msgId: string) => {
    setLoadingDetail(true);
    setSelected(null);
    try {
      const response = await fetch(`/api/admin/email/${encodeURIComponent(msgId)}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Error loading message detail");
        return;
      }
      setSelected(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading message detail");
    } finally {
      setLoadingDetail(false);
    }
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
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1"
          >
            ← {t("Terug naar admin", "Retour admin", "Back to admin")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📧 {t("E-mail activiteit", "Activité e-mail", "Email activity")}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {t(
            "Zoek op e-mailadres of beheer de SendGrid suppression-lijsten (bounces, blocks, ...).",
            "Rechercher par e-mail ou gérer les listes de suppression SendGrid (bounces, blocks, ...).",
            "Search by email or manage the SendGrid suppression lists (bounces, blocks, ...)."
          )}
        </p>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab("search")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "search"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🔍 {t("Zoek op e-mail", "Rechercher par e-mail", "Search by email")}
            </button>
            <button
              onClick={() => setActiveTab("lists")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lists"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🛡️ {t("Suppression-lijsten", "Listes de suppression", "Suppression lists")}
            </button>
          </nav>
        </div>

        {activeTab === "search" && (
          <>

        {/* Search form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <form onSubmit={search} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs text-gray-500 mb-1">{t("E-mailadres", "Adresse e-mail", "Email address")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("Periode", "Période", "Range")}</label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>{t("7 dagen", "7 jours", "7 days")}</option>
                <option value={14}>{t("14 dagen", "14 jours", "14 days")}</option>
                <option value={30}>{t("30 dagen", "30 jours", "30 days")}</option>
                <option value={60}>{t("60 dagen", "60 jours", "60 days")}</option>
                <option value={90}>{t("90 dagen", "90 jours", "90 days")}</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={searching || !email.trim()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              {searching ? t("Zoeken...", "Recherche...", "Searching...") : t("Zoek", "Chercher", "Search")}
            </button>
          </form>
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Suppression status */}
        {searched && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                🛡️ {t("Suppression status", "Statut de suppression", "Suppression status")}
              </h2>
              {loadingSuppressions && (
                <span className="text-xs text-gray-400 animate-pulse">
                  {t("Controleren...", "Vérification...", "Checking...")}
                </span>
              )}
            </div>

            {!suppressions ? (
              <div className="text-sm text-gray-500">
                {t("Niet beschikbaar", "Non disponible", "Not available")}
              </div>
            ) : (
              (() => {
                const types: SuppressionType[] = ["bounces", "blocks", "invalid_emails", "spam_reports"];
                const active = types.filter((type) => suppressions[type] !== null);

                if (active.length === 0) {
                  return (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                      ✓ {t(
                        "Dit adres staat op géén enkele suppression-lijst bij SendGrid.",
                        "Cette adresse n'est sur aucune liste de suppression chez SendGrid.",
                        "This address is not on any SendGrid suppression list."
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {active.map((type) => {
                      const entry = suppressions[type]!;
                      const label = SUPPRESSION_LABELS[type];
                      return (
                        <div
                          key={type}
                          className={`border rounded-lg p-3 flex items-start justify-between gap-3 ${label.color}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {t(label.nl, label.fr, label.en)}
                              </span>
                              {entry.status && (
                                <span className="text-xs font-mono bg-white/60 px-2 py-0.5 rounded">
                                  {entry.status}
                                </span>
                              )}
                            </div>
                            {entry.reason && (
                              <div className="text-xs mt-1 break-words">
                                <span className="opacity-75">{t("Reden", "Raison", "Reason")}:</span> {entry.reason}
                              </div>
                            )}
                            {entry.created && (
                              <div className="text-xs opacity-75 mt-1">
                                {t("Sinds", "Depuis", "Since")}: {formatDate(new Date(entry.created * 1000).toISOString())}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromSuppression(type)}
                            disabled={removingType === type}
                            className="flex-shrink-0 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                          >
                            {removingType === type
                              ? t("Bezig...", "En cours...", "Removing...")
                              : t("Verwijder van lijst", "Retirer de la liste", "Remove from list")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Results */}
        {searched && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message list */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {t("Berichten", "Messages", "Messages")}
                </h2>
                <span className="text-xs text-gray-500">
                  {messages.length} {t("resultaten", "résultats", "results")}
                </span>
              </div>
              {messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {t("Geen berichten gevonden", "Aucun message trouvé", "No messages found")}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
                  {messages.map((msg) => (
                    <button
                      key={msg.msg_id}
                      onClick={() => loadDetail(msg.msg_id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selected?.msg_id === msg.msg_id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="font-medium text-sm text-gray-900 truncate flex-1" title={msg.subject}>
                          {msg.subject || <em className="text-gray-400">{t("(geen onderwerp)", "(pas de sujet)", "(no subject)")}</em>}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${statusColor(msg.status)}`}>
                          {msg.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        <span className="text-gray-400">{t("Van", "De", "From")}:</span> {msg.from_email}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        <span className="text-gray-400">{t("Aan", "À", "To")}:</span> {msg.to_email}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{formatDate(msg.last_event_time)}</span>
                        <div className="flex gap-2 text-xs text-gray-500">
                          {msg.opens_count !== undefined && msg.opens_count > 0 && (
                            <span>👁 {msg.opens_count}</span>
                          )}
                          {msg.clicks_count !== undefined && msg.clicks_count > 0 && (
                            <span>🔗 {msg.clicks_count}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detail / trace */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">
                  🛰 {t("Event trace", "Trace des événements", "Event trace")}
                </h2>
              </div>
              {loadingDetail ? (
                <div className="p-8 text-center text-gray-400 text-sm animate-pulse">
                  {t("Laden...", "Chargement...", "Loading...")}
                </div>
              ) : !selected ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {t(
                    "Selecteer een bericht om de traceroute te zien",
                    "Sélectionnez un message pour voir l'itinéraire",
                    "Select a message to view its event trace"
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Message meta */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                    <div>
                      <span className="text-gray-500">{t("Onderwerp", "Sujet", "Subject")}:</span>{" "}
                      <span className="font-medium text-gray-900">{selected.subject || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t("Van", "De", "From")}:</span>{" "}
                      <span className="text-gray-900">{selected.from_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t("Aan", "À", "To")}:</span>{" "}
                      <span className="text-gray-900">{selected.to_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(selected.status)}`}>
                        {selected.status}
                      </span>
                    </div>
                    {selected.categories && selected.categories.length > 0 && (
                      <div>
                        <span className="text-gray-500">{t("Categorieën", "Catégories", "Categories")}:</span>{" "}
                        {selected.categories.map((c) => (
                          <span key={c} className="inline-block ml-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {selected.outbound_ip && (
                      <div>
                        <span className="text-gray-500">{t("Uitgaand IP", "IP sortant", "Outbound IP")}:</span>{" "}
                        <span className="font-mono text-xs text-gray-700">{selected.outbound_ip}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 pt-1">
                      <span className="font-mono">msg_id: {selected.msg_id}</span>
                    </div>
                  </div>

                  {/* Event timeline */}
                  {selected.events && selected.events.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
                      {[...selected.events]
                        .sort((a, b) => new Date(a.processed).getTime() - new Date(b.processed).getTime())
                        .map((event, idx) => (
                          <div key={idx} className="relative">
                            <div className={`absolute -left-[1.85rem] w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm ${eventColor(event.event_name)}`}>
                              {eventIcon(event.event_name)}
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase ${eventColor(event.event_name)}`}>
                                  {event.event_name}
                                </span>
                                <span className="text-xs text-gray-400">{formatDate(event.processed)}</span>
                              </div>
                              {event.reason && (
                                <div className="text-xs text-gray-700 mt-1">
                                  <span className="text-gray-500">{t("Reden", "Raison", "Reason")}:</span> {event.reason}
                                </div>
                              )}
                              {event.bounce_classification && (
                                <div className="text-xs text-gray-700 mt-1">
                                  <span className="text-gray-500">Bounce:</span> {event.bounce_classification}
                                </div>
                              )}
                              {event.attempt_num !== undefined && (
                                <div className="text-xs text-gray-700 mt-1">
                                  <span className="text-gray-500">{t("Poging", "Tentative", "Attempt")}:</span> #{event.attempt_num}
                                </div>
                              )}
                              {event.url && (
                                <div className="text-xs text-gray-700 mt-1 break-all">
                                  <span className="text-gray-500">URL:</span>{" "}
                                  <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {event.url}
                                  </a>
                                </div>
                              )}
                              {event.mx_server && (
                                <div className="text-xs text-gray-500 mt-1 font-mono">MX: {event.mx_server}</div>
                              )}
                              {event.ip && (
                                <div className="text-xs text-gray-500 mt-1 font-mono">IP: {event.ip}</div>
                              )}
                              {event.http_user_agent && (
                                <div className="text-xs text-gray-500 mt-1 truncate" title={event.http_user_agent}>
                                  UA: {event.http_user_agent}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      {t("Geen events beschikbaar", "Aucun événement disponible", "No events available")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === "lists" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SUPPRESSION_LABELS) as SuppressionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setListType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      listType === type
                        ? SUPPRESSION_LABELS[type].color + " border-current"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {t(SUPPRESSION_LABELS[type].nl, SUPPRESSION_LABELS[type].fr, SUPPRESSION_LABELS[type].en)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fetchSuppressionList(listType)}
                disabled={loadingList}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                {loadingList ? t("Laden...", "Chargement...", "Loading...") : `🔄 ${t("Ververs", "Actualiser", "Refresh")}`}
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <input
                type="text"
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                placeholder={t("Filter op e-mail...", "Filtrer par e-mail...", "Filter by email...")}
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500">
                {(() => {
                  const filtered = listFilter
                    ? listEntries.filter((e) => e.email.toLowerCase().includes(listFilter.toLowerCase()))
                    : listEntries;
                  return `${filtered.length} / ${listEntries.length}`;
                })()}
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {loadingList ? (
              <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
                {t("Laden...", "Chargement...", "Loading...")}
              </div>
            ) : listEntries.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                {t("De lijst is leeg", "La liste est vide", "The list is empty")}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
                {listEntries
                  .filter((e) => !listFilter || e.email.toLowerCase().includes(listFilter.toLowerCase()))
                  .map((entry) => (
                    <div
                      key={entry.email}
                      className="p-3 flex items-start justify-between gap-3 hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-gray-900 truncate">{entry.email}</div>
                        {entry.reason && (
                          <div className="text-xs text-gray-600 mt-1 break-words">
                            <span className="text-gray-400">{t("Reden", "Raison", "Reason")}:</span> {entry.reason}
                          </div>
                        )}
                        {entry.created && (
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(new Date(entry.created * 1000).toISOString())}
                            {entry.status && <span className="ml-2 font-mono">({entry.status})</span>}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeEntryFromList(listType, entry.email)}
                        disabled={removingEmail === entry.email}
                        className="flex-shrink-0 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded hover:bg-red-50 hover:text-red-700 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                      >
                        {removingEmail === entry.email
                          ? t("Bezig...", "En cours...", "Removing...")
                          : t("Verwijder", "Retirer", "Remove")}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
