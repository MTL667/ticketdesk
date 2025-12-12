"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SystemStatus } from "@/components/SystemStatus";

export default function Home() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
    if (status === "authenticated") {
      fetchBanner();
      checkAdmin();
    }
  }, [status]);

  const fetchBanner = async () => {
    try {
      const response = await fetch("/api/settings/banner");
      if (response.ok) {
        const data = await response.json();
        setBanner(data.banner);
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  };

  const checkAdmin = async () => {
    try {
      const response = await fetch("/api/admin/check");
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      }
    } catch (error) {
      console.error("Error checking admin:", error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("servicedesk")}
            </h1>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium hover:bg-red-200"
                >
                  Admin
                </Link>
              )}
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
        {/* Banner */}
        {banner && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 text-blue-800 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">📢</span>
            <p className="text-sm">{banner}</p>
          </div>
        )}

        {/* System Status */}
        <SystemStatus />

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("welcome")}
          </h2>
          <p className="text-gray-600">
            {t("welcomeDescription")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link
            href="/tickets/new"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="text-xl font-semibold text-gray-900">
                {t("newTicket")}
              </h3>
            </div>
          </Link>

          <Link
            href="/tickets"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("myTickets")}
              </h3>
              <p className="text-gray-600">
                {t("myTicketsDescription")}
              </p>
            </div>
          </Link>

          <Link
            href="/releases"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("releases")}
              </h3>
              <p className="text-gray-600">
                {t("releasesDescription")}
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}


