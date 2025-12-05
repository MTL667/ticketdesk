"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import { TicketComments } from "@/components/TicketComments";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface TicketDetail {
  id: string;
  ticketId?: string;
  name: string;
  description: string;
  fullDescription: string;
  status: string;
  priority: string;
  dateCreated: string;
  dateUpdated: string;
  businessUnit?: string;
  jiraStatus?: string;
  jiraAssignee?: string;
  jiraUrl?: string;
  attachments?: Array<{
    id: string;
    url: string;
    title: string;
  }>;
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

function getStatusStyle(status: string): { bg: string; text: string } {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("complete") || statusLower.includes("closed")) {
    return { bg: "bg-green-500", text: "text-white" };
  }
  if (statusLower.includes("progress") || statusLower.includes("doing") || statusLower.includes("development")) {
    return { bg: "bg-purple-500", text: "text-white" };
  }
  if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("review")) {
    return { bg: "bg-yellow-500", text: "text-white" };
  }
  if (statusLower.includes("new") || statusLower.includes("open") || statusLower.includes("to do")) {
    return { bg: "bg-blue-500", text: "text-white" };
  }
  return { bg: "bg-gray-500", text: "text-white" };
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

export default function TicketDetailPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const params = useParams();
  const id = params.id as string;
  const pageRef = useRef<HTMLDivElement>(null);
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent auto-scroll to bottom
  useEffect(() => {
    if (pageRef.current) {
      window.scrollTo(0, 0);
    }
  }, [ticket]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTicket();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status, id]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      } else {
        setTicket(null);
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-xl font-semibold text-gray-700">
            {t("loadingTicket")}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/signin");
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                {t("servicedesk")}
              </Link>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <span className="text-sm text-gray-600">{session.user?.email}</span>
                <Link
                  href="/api/auth/signout"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t("logout")}
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("ticketNotFound")}</h1>
            <p className="text-gray-600 mb-6">
              {t("ticketNotFoundDescription")}
            </p>
            <Link
              href="/tickets"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {t("backToTickets")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusStyle = getStatusStyle(ticket.status);
  const priorityStyle = getPriorityStyle(ticket.priority);

  return (
    <div ref={pageRef} className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
              {t("servicedesk")}
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {t("logout")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <Link
            href="/tickets"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {t("backToTickets")}
          </Link>
        </div>

        {/* Header Banner - Same style as list */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 flex items-center gap-4">
            {/* Tags */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
                {ticket.priority}
              </span>
            </div>

            {/* Title and meta */}
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-gray-900 text-lg truncate">
                {ticket.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                {ticket.ticketId && (
                  <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {ticket.ticketId}
                  </span>
                )}
                <span>{formatDate(ticket.dateCreated)}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              <span className={`px-4 py-1.5 rounded text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {ticket.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("description")}
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("attachments")}
                </h2>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-gray-50"
                    >
                      <span>📎</span>
                      <span>{attachment.title || "Attachment"}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <TicketComments ticketId={ticket.id} userEmail={session.user?.email || ""} />
          </div>

          {/* Sidebar - Ticket Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("ticketDetails")}
              </h2>
              <dl className="space-y-4">
                {ticket.ticketId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("ticketId")}</dt>
                    <dd className="mt-1">
                      <span className="font-mono text-lg bg-blue-50 text-blue-700 px-3 py-1 rounded font-semibold">
                        {ticket.ticketId}
                      </span>
                    </dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("status")}</dt>
                  <dd className="mt-1">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {ticket.status}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("priority")}</dt>
                  <dd className="mt-1 text-gray-900 capitalize">{ticket.priority}</dd>
                </div>

                {ticket.businessUnit && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("businessUnit")}</dt>
                    <dd className="mt-1 text-gray-900">{ticket.businessUnit}</dd>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <dt className="text-sm font-medium text-gray-500">{t("createdOn")}</dt>
                  <dd className="mt-1 text-gray-900 text-sm">{formatDate(ticket.dateCreated)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("lastUpdated")}</dt>
                  <dd className="mt-1 text-gray-900 text-sm">{formatDate(ticket.dateUpdated)}</dd>
                </div>
              </dl>
            </div>

            {/* Jira Integration */}
            {(ticket.jiraStatus || ticket.jiraAssignee || ticket.jiraUrl) && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-blue-600">🔗</span> Jira
                </h2>
                <dl className="space-y-4">
                  {ticket.jiraStatus && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("jiraStatus")}</dt>
                      <dd className="mt-1">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                          {ticket.jiraStatus}
                        </span>
                      </dd>
                    </div>
                  )}
                  
                  {ticket.jiraAssignee && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("jiraAssignee")}</dt>
                      <dd className="mt-1 text-gray-900">{ticket.jiraAssignee}</dd>
                    </div>
                  )}
                  
                  {ticket.jiraUrl && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("jiraUrl")}</dt>
                      <dd className="mt-1">
                        <a
                          href={ticket.jiraUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {t("openInJira")} ↗
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
