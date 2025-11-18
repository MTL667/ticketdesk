"use client";

import { useEffect, useState } from "react";
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

export default function TicketDetailPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const params = useParams();
  const id = params.id as string;
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            {t("loadingTickets")}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/tickets"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {t("backToTickets")}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{ticket.name}</h1>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-6">
            {/* Ticket Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("ticketDetails")}
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ticket.ticketId && (
                  <>
                    <dt className="font-medium text-gray-700">{t("ticketId")}</dt>
                    <dd className="text-gray-900">
                      <span className="font-mono text-lg bg-blue-50 text-blue-700 px-3 py-1 rounded font-semibold">{ticket.ticketId}</span>
                    </dd>
                  </>
                )}
                <dt className="font-medium text-gray-700">{t("clickupId")}</dt>
                <dd className="text-gray-900">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{ticket.id}</span>
                </dd>
                <dt className="font-medium text-gray-700">{t("priority")}</dt>
                <dd className="text-gray-900 capitalize">{ticket.priority}</dd>
                <dt className="font-medium text-gray-700">{t("status")}</dt>
                <dd className="text-gray-900">{ticket.status}</dd>
                <dt className="font-medium text-gray-700">{t("createdOn")}</dt>
                <dd className="text-gray-900">{formatDate(ticket.dateCreated)}</dd>
                <dt className="font-medium text-gray-700">{t("lastUpdated")}</dt>
                <dd className="text-gray-900">{formatDate(ticket.dateUpdated)}</dd>
              </dl>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("description")}
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div>
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
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <TicketComments ticketId={ticket.id} userEmail={session.user?.email || ""} />
        </div>
      </main>
    </div>
  );
}
