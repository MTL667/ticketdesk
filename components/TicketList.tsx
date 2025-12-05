"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Ticket } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface TicketListProps {
  tickets: Ticket[];
}

function formatDate(dateString: string, language: string): string {
  try {
    const date = new Date(parseInt(dateString));
    return new Intl.DateTimeFormat(language === 'nl' ? 'nl-BE' : language === 'fr' ? 'fr-BE' : 'en-US', {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("complete") || statusLower.includes("closed")) {
    return { bg: "bg-green-500", text: "text-white", label: status };
  }
  if (statusLower.includes("progress") || statusLower.includes("doing") || statusLower.includes("development")) {
    return { bg: "bg-purple-500", text: "text-white", label: status };
  }
  if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("review")) {
    return { bg: "bg-yellow-500", text: "text-white", label: status };
  }
  if (statusLower.includes("new") || statusLower.includes("open") || statusLower.includes("to do")) {
    return { bg: "bg-blue-500", text: "text-white", label: status };
  }
  return { bg: "bg-gray-500", text: "text-white", label: status };
}

function getPriorityStyle(priority: string): { bg: string; text: string } {
  const priorityLower = (priority || "normal").toLowerCase();
  if (priorityLower === "urgent") {
    return { bg: "bg-red-100", text: "text-red-700" };
  }
  if (priorityLower === "high") {
    return { bg: "bg-orange-100", text: "text-orange-700" };
  }
  if (priorityLower === "normal") {
    return { bg: "bg-blue-100", text: "text-blue-700" };
  }
  if (priorityLower === "low") {
    return { bg: "bg-gray-100", text: "text-gray-700" };
  }
  return { bg: "bg-gray-100", text: "text-gray-700" };
}

export function TicketList({ tickets }: TicketListProps) {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Filter tickets based on search query
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;

    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (ticket) =>
        ticket.name.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.ticketId?.toLowerCase().includes(query) ||
        ticket.status.toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  // Paginate filtered tickets
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {filteredTickets.length} {t("ticketsCount")} {tickets.length} {t("ticketsWord")}
        </p>
      </div>

      {/* Ticket List - Compact View */}
      {paginatedTickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
          {searchQuery ? (
            <>
              <p className="text-gray-600 mb-2">
                {t("noTicketsFound")} &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => handleSearchChange("")}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {t("clearSearch")}
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">{t("noTickets")}</p>
              <p className="text-sm text-gray-500 mb-4">{t("noTicketsHelp")}</p>
              <Link
                href="/tickets/new"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {t("createFirstTicket")}
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedTickets.map((ticket) => {
              const statusStyle = getStatusStyle(ticket.status);
              const priorityStyle = getPriorityStyle(ticket.priority || "normal");
              
              return (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  {/* Compact ticket row */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    {/* Left: Tags */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Priority tag */}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
                        {ticket.priority || "normal"}
                      </span>
                    </div>

                    {/* Center: Title and Ticket ID */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          {ticket.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        {ticket.ticketId && (
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {ticket.ticketId}
                          </span>
                        )}
                        <span>{formatDate(ticket.dateCreated, language)}</span>
                        {ticket.jiraStatus && (
                          <span className="text-purple-600">Jira: {ticket.jiraStatus}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Status badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                      <span className="text-gray-400 text-sm">›</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← {t("previous")}
              </button>
              
              <span className="text-sm text-gray-600 px-3">
                {t("page")} {currentPage} {t("of")} {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("next")} →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
