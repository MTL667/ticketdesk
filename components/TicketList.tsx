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

// Categorize status for filtering
function getStatusCategory(status: string): "done" | "active" | "waiting" | "cancelled" {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("complete") || statusLower.includes("closed")) {
    return "done";
  }
  if (statusLower.includes("cancel")) {
    return "cancelled";
  }
  if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("review") || statusLower.includes("feedback")) {
    return "waiting";
  }
  return "active";
}

function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("complete") || statusLower.includes("closed")) {
    return { bg: "bg-green-500", text: "text-white", label: status };
  }
  if (statusLower.includes("cancel")) {
    return { bg: "bg-gray-500", text: "text-white", label: status };
  }
  if (statusLower.includes("progress") || statusLower.includes("doing") || statusLower.includes("development")) {
    return { bg: "bg-purple-500", text: "text-white", label: status };
  }
  if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("review") || statusLower.includes("feedback")) {
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
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [hideDone, setHideDone] = useState(true); // Hide done/closed by default
  const [hideCancelled, setHideCancelled] = useState(true); // Hide cancelled by default
  const ITEMS_PER_PAGE = 15;

  // Get unique statuses from tickets
  const uniqueStatuses = useMemo(() => {
    const statuses = new Map<string, number>();
    tickets.forEach(ticket => {
      const status = ticket.status;
      statuses.set(status, (statuses.get(status) || 0) + 1);
    });
    return Array.from(statuses.entries()).sort((a, b) => b[1] - a[1]);
  }, [tickets]);

  // Filter tickets based on search query and status filters
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status category filter (done/cancelled)
      const category = getStatusCategory(ticket.status);
      if (hideDone && category === "done") return false;
      if (hideCancelled && category === "cancelled") return false;
      
      // Specific status filter
      if (selectedStatuses.size > 0 && !selectedStatuses.has(ticket.status)) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          ticket.name.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          ticket.ticketId?.toLowerCase().includes(query) ||
          ticket.status.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [tickets, searchQuery, selectedStatuses, hideDone, hideCancelled]);

  // Paginate filtered tickets
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const toggleStatus = (status: string) => {
    const newSet = new Set(selectedStatuses);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setSelectedStatuses(newSet);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedStatuses(new Set());
    setHideDone(true);
    setHideCancelled(true);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const showAllStatuses = () => {
    setHideDone(false);
    setHideCancelled(false);
    setSelectedStatuses(new Set());
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
      </div>

      {/* Status Filters */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-600 mr-1">
            {language === "nl" ? "Filter:" : language === "fr" ? "Filtrer:" : "Filter:"}
          </span>
          
          {/* Quick toggles */}
          <button
            onClick={() => { setHideDone(!hideDone); setCurrentPage(1); }}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              hideDone 
                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {hideDone ? "◯" : "✓"} Done/Closed
          </button>
          
          <button
            onClick={() => { setHideCancelled(!hideCancelled); setCurrentPage(1); }}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              hideCancelled 
                ? "bg-gray-200 text-gray-600 hover:bg-gray-300" 
                : "bg-gray-500 text-white hover:bg-gray-600"
            }`}
          >
            {hideCancelled ? "◯" : "✓"} Cancelled
          </button>

          <span className="text-gray-300 mx-1">|</span>

          <button
            onClick={showAllStatuses}
            className="px-2 py-1 rounded text-xs font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            {language === "nl" ? "Toon alles" : language === "fr" ? "Tout afficher" : "Show all"}
          </button>

          {(selectedStatuses.size > 0 || hideDone || hideCancelled || searchQuery) && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100"
            >
              {language === "nl" ? "Reset filters" : language === "fr" ? "Réinitialiser" : "Reset"}
            </button>
          )}
        </div>

        {/* Individual status buttons */}
        <div className="flex flex-wrap gap-1">
          {uniqueStatuses.map(([status, count]) => {
            const isSelected = selectedStatuses.has(status);
            const statusStyle = getStatusStyle(status);
            const category = getStatusCategory(status);
            const isHidden = (hideDone && category === "done") || (hideCancelled && category === "cancelled");
            
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                disabled={isHidden && !isSelected}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                  isSelected 
                    ? `${statusStyle.bg} ${statusStyle.text} ring-2 ring-offset-1 ring-blue-400`
                    : isHidden
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-3 text-xs text-gray-500">
        {filteredTickets.length} {t("ticketsCount")} {tickets.length} {t("ticketsWord")}
        {(hideDone || hideCancelled || selectedStatuses.size > 0) && (
          <span className="text-blue-600 ml-1">
            ({language === "nl" ? "gefilterd" : language === "fr" ? "filtré" : "filtered"})
          </span>
        )}
      </p>

      {/* Ticket List - Compact View */}
      {paginatedTickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
          {searchQuery || selectedStatuses.size > 0 || hideDone || hideCancelled ? (
            <>
              <p className="text-gray-600 mb-2">
                {language === "nl" && "Geen tickets gevonden met deze filters"}
                {language === "fr" && "Aucun ticket trouvé avec ces filtres"}
                {language === "en" && "No tickets found with these filters"}
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {language === "nl" ? "Reset filters" : language === "fr" ? "Réinitialiser les filtres" : "Reset filters"}
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
