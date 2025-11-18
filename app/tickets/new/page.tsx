"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function NewTicketPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

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

  const clickupFormUrl = process.env.NEXT_PUBLIC_CLICKUP_FORM_URL;

  if (!clickupFormUrl) {
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              {t("formNotConfigured")}
            </h2>
            <p className="text-red-700">
              {t("formNotConfiguredHelp")}
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              {t("back")} →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Pre-fill email via URL parameter
  const userEmail = session.user?.email || "";
  const separator = clickupFormUrl.includes("?") ? "&" : "?";
  const prefilledFormUrl = `${clickupFormUrl}${separator}Contact Email=${encodeURIComponent(userEmail)}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800"
              >
                ← {t("back")}
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {t("newTicketTitle")}
              </h1>
            </div>
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

      <main className="flex-1 flex flex-col">
        <iframe
          src={prefilledFormUrl}
          className="w-full flex-1 border-0"
          style={{ minHeight: "calc(100vh - 64px)" }}
          title="ClickUp Ticket Form"
          allowFullScreen
        />
      </main>
    </div>
  );
}
