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
      if (!data.isAdmin) {
        redirect("/");
      }
    } catch {
      redirect("/");
    } finally {
      setIsLoading(false);
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

    try {
      const response = await fetch(
        `/api/admin/email?email=${encodeURIComponent(email.trim())}&days=${days}`
      );
      const data = await response.json();

      if (!response.ok) {
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
            "Zoek op e-mailadres om de laatste 30 dagen aan SendGrid-activiteit en hun traceroute te bekijken.",
            "Rechercher par e-mail pour voir la dernière activité SendGrid et leur itinéraire.",
            "Search by email to view the last 30 days of SendGrid activity and their event trace."
          )}
        </p>

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
      </main>
    </div>
  );
}
