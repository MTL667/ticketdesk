"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReleaseList } from "@/components/ReleaseList";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface Release {
  id: string;
  ticketId?: string;
  name: string;
  description: string;
  status: string;
  priority?: string;
  dueDate?: string | null;
  dateCreated: string;
  dateUpdated: string;
  businessUnit?: string;
  jiraStatus?: string;
}

export default function ReleasesPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReleases = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/releases");
      if (response.ok) {
        const data = await response.json();
        setReleases(data.releases || []);
      }
    } catch (error) {
      console.error("Error fetching releases:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReleases();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status, fetchReleases]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="text-4xl">📦</div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">
            {language === "nl" && "Releases laden..."}
            {language === "fr" && "Chargement des releases..."}
            {language === "en" && "Loading releases..."}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/signin");
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
              <LanguageSelector />
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {language === "nl" ? "Uitloggen" : language === "fr" ? "Déconnexion" : "Logout"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === "nl" && "Releases"}
              {language === "fr" && "Releases"}
              {language === "en" && "Releases"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {releases.length} {language === "nl" ? "release notes" : language === "fr" ? "notes de version" : "release notes"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchReleases(true)}
              disabled={isRefreshing}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
            </button>
            <Link
              href="/tickets"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              {language === "nl" ? "Mijn Tickets" : language === "fr" ? "Mes Tickets" : "My Tickets"}
            </Link>
          </div>
        </div>

        <ReleaseList releases={releases} />
      </main>
    </div>
  );
}

