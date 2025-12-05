"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface ReleaseDetail {
  id: string;
  ticketId?: string;
  name: string;
  description: string;
  fullDescription?: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  dateCreated: string;
  dateUpdated: string;
  businessUnit?: string;
  jiraStatus?: string;
  jiraAssignee?: string;
  jiraUrl?: string;
}

function formatDate(dateString: string | null | undefined, language: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(parseInt(dateString));
    return new Intl.DateTimeFormat(language === 'nl' ? 'nl-BE' : language === 'fr' ? 'fr-BE' : 'en-US', {
      day: "numeric",
      month: "long",
      year: "numeric",
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
  if (statusLower.includes("cancel")) {
    return { bg: "bg-gray-500", text: "text-white" };
  }
  if (statusLower.includes("progress") || statusLower.includes("doing") || statusLower.includes("development")) {
    return { bg: "bg-purple-500", text: "text-white" };
  }
  if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("review")) {
    return { bg: "bg-yellow-500", text: "text-white" };
  }
  return { bg: "bg-blue-500", text: "text-white" };
}

export default function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRelease();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status, resolvedParams.id]);

  const fetchRelease = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/releases/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setRelease(data);
      } else if (response.status === 404) {
        setError(language === "nl" ? "Release niet gevonden" : language === "fr" ? "Release non trouvée" : "Release not found");
      } else {
        setError(language === "nl" ? "Fout bij laden" : language === "fr" ? "Erreur de chargement" : "Error loading");
      }
    } catch (err) {
      console.error("Error fetching release:", err);
      setError(language === "nl" ? "Fout bij laden" : language === "fr" ? "Erreur de chargement" : "Error loading");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <div className="text-gray-600">
            {language === "nl" && "Release laden..."}
            {language === "fr" && "Chargement..."}
            {language === "en" && "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/signin");
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                ServiceDesk
              </Link>
              <div className="flex items-center gap-4">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/releases" className="text-blue-600 hover:text-blue-800">
              ← {language === "nl" ? "Terug naar releases" : language === "fr" ? "Retour aux releases" : "Back to releases"}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!release) return null;

  const statusStyle = getStatusStyle(release.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
              ServiceDesk
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <Link href="/api/auth/signout" className="text-sm text-blue-600 hover:text-blue-800">
                {language === "nl" ? "Uitloggen" : language === "fr" ? "Déconnexion" : "Logout"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/releases"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
        >
          ← {language === "nl" ? "Terug naar releases" : language === "fr" ? "Retour aux releases" : "Back to releases"}
        </Link>

        {/* Release Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {release.ticketId && (
                  <span className="inline-block font-mono text-sm bg-gray-100 px-2 py-1 rounded mb-2">
                    {release.ticketId}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900">{release.name}</h1>
              </div>
              <span className={`px-4 py-2 rounded-lg text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {release.status}
              </span>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              {release.dueDate && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {language === "nl" ? "Deadline" : language === "fr" ? "Date limite" : "Due Date"}
                  </p>
                  <p className="text-sm font-medium text-orange-600 mt-1">
                    📅 {formatDate(release.dueDate, language)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {language === "nl" ? "Aangemaakt" : language === "fr" ? "Créé" : "Created"}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatDate(release.dateCreated, language)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {language === "nl" ? "Prioriteit" : language === "fr" ? "Priorité" : "Priority"}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                  {release.priority}
                </p>
              </div>
              {release.businessUnit && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Business Unit</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{release.businessUnit}</p>
                </div>
              )}
            </div>

            {/* Jira info */}
            {(release.jiraStatus || release.jiraUrl) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Jira</h3>
                <div className="flex flex-wrap gap-4">
                  {release.jiraStatus && (
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-medium text-purple-600">{release.jiraStatus}</p>
                    </div>
                  )}
                  {release.jiraAssignee && (
                    <div>
                      <p className="text-xs text-gray-500">Assignee</p>
                      <p className="text-sm font-medium text-gray-900">{release.jiraAssignee}</p>
                    </div>
                  )}
                  {release.jiraUrl && (
                    <div>
                      <a
                        href={release.jiraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        🔗 {language === "nl" ? "Open in Jira" : language === "fr" ? "Ouvrir dans Jira" : "Open in Jira"}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === "nl" ? "Beschrijving" : language === "fr" ? "Description" : "Description"}
            </h2>
            <div className="prose prose-sm max-w-none">
              {release.fullDescription || release.description ? (
                <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                  {release.fullDescription || release.description}
                </pre>
              ) : (
                <p className="text-gray-500 italic">
                  {language === "nl" ? "Geen beschrijving" : language === "fr" ? "Pas de description" : "No description"}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

