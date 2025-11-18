"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Ticket } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface TicketListProps {
  tickets: Ticket[];
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(parseInt(dateString));
    return new Intl.DateTimeFormat("nl-BE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("complete")) {
    return "bg-green-100 text-green-800";
  }
  if (statusLower.includes("progress") || statusLower.includes("doing")) {
    return "bg-blue-100 text-blue-800";
  }
  if (statusLower.includes("waiting") || statusLower.includes("pending")) {
    return "bg-yellow-100 text-yellow-800";
  }
  if (statusLower.includes("closed") || statusLower.includes("cancel")) {
    return "bg-gray-100 text-gray-800";
  }
  return "bg-gray-100 text-gray-800";
}

function getPriorityColor(priority: string): string {
  const priorityLower = priority.toLowerCase();
  if (priorityLower === "urgent") {
    return "bg-red-100 text-red-800";
  }
  if (priorityLower === "high") {
    return "bg-orange-100 text-orange-800";
  }
  if (priorityLower === "normal") {
    return "bg-blue-100 text-blue-800";
  }
  if (priorityLower === "low") {
    return "bg-gray-100 text-gray-800";
  }
  return "bg-gray-100 text-gray-800";
}

export function TicketList({ tickets }: TicketListProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter tickets based on search query
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;

    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (ticket) =>
        ticket.name.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query) ||
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
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {filteredTickets.length} {t("ticketsCount")} {tickets.length} {t("ticketsWord")}
        </p>
      </div>

      {/* Ticket List */}
      {paginatedTickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          {searchQuery ? (
            <>
              <p className="text-gray-600 mb-2">
                {t("noTicketsFound")} &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => handleSearchChange("")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {t("clearSearch")}
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">{t("noTickets")}</p>
                <p className="text-sm text-gray-500">
                  {t("noTicketsHelp")}
                </p>
              </div>
              <Link
                href="/tickets/new"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {t("createFirstTicket")}
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {ticket.name}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                          ticket.priority || "normal"
                        )}`}
                      >
                        {ticket.priority || "normal"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {ticket.ticketId && (
                        <p>
                          <span className="font-medium">{t("ticketId")}:</span>{" "}
                          <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                            {ticket.ticketId}
                          </span>
                        </p>
                      )}
                      <p>
                        <span className="font-medium">{t("clickupId")}:</span>{" "}
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {ticket.id}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">{t("created")}:</span>{" "}
                        {formatDate(ticket.dateCreated)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-400">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← {t("previous")}
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;
                  
                  const showEllipsis =
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2);

                  if (showEllipsis) {
                    return (
                      <span
                        key={page}
                        className="px-3 py-2 text-gray-500"
                      >
                        ...
                      </span>
                    );
                  }

                  if (!showPage) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-md ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("next")} →
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            {t("page")} {currentPage} {t("of")} {totalPages}
          </p>
        </>
      )}
    </>
  );
}

