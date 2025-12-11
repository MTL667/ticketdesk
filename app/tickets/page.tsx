"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket } from "@/types";
import { TicketList } from "@/components/TicketList";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface TicketsMetadata {
  totalTasksSearched: number;
  userTicketsFound: number;
  listCount: number;
  lastSyncAt?: string;
  syncStatus?: string;
}

interface SyncStatus {
  lastSync?: {
    completedAt: string;
    status: string;
    ticketsSynced: number;
    ticketsTotal: number;
  };
  isRunning: boolean;
}

function formatSyncTime(dateString: string | undefined, language: string): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
    return language === "nl" ? "zojuist" : language === "fr" ? "à l'instant" : "just now";
  } else if (diffMins < 60) {
    const minsText = language === "nl" ? "min geleden" : language === "fr" ? "min" : "min ago";
    return `${diffMins} ${minsText}`;
  } else {
    return date.toLocaleTimeString(language === "nl" ? "nl-BE" : language === "fr" ? "fr-BE" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default function TicketsPage() {
  const { data: session, status } = useSession();
  const { t, language } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metadata, setMetadata] = useState<TicketsMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchTickets = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/tickets");
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setMetadata(data.metadata || null);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/sync");
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
        setIsSyncing(data.isRunning);
      }
    } catch (error) {
      console.error("Error fetching sync status:", error);
    }
  }, []);

  const checkAdmin = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/check");
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      }
    } catch (error) {
      console.error("Error checking admin:", error);
    }
  }, []);

  const triggerSync = async (force = false) => {
    setIsSyncing(true);
    let pollIntervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const cleanup = () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
    
    try {
      // If force, first reset stuck syncs
      if (force) {
        console.log("Force sync: resetting stuck syncs...");
        await fetch("/api/sync", { method: "DELETE" });
      }
      
      const url = force ? "/api/sync?force=true" : "/api/sync";
      const response = await fetch(url, { method: "POST" });
      
      console.log("Sync POST response:", response.status);
      
      // Start polling regardless of response (409 means already running)
      if (response.ok || response.status === 409) {
        let lastSyncId: string | null = null;
        let noChangeCount = 0;
        
        // Poll for completion
        pollIntervalId = setInterval(async () => {
          try {
            const statusResponse = await fetch("/api/sync");
            if (statusResponse.ok) {
              const data = await statusResponse.json();
              setSyncStatus(data);
              
              // Check if sync completed
              if (!data.isRunning) {
                console.log("Sync completed, refreshing tickets");
                cleanup();
                setIsSyncing(false);
                fetchTickets(true);
                return;
              }
              
              // Check if sync is stuck (same sync ID, no progress)
              if (data.lastSync?.id === lastSyncId) {
                noChangeCount++;
                if (noChangeCount > 30) { // ~60 seconds of no change
                  console.log("Sync appears stuck, stopping poll");
                  cleanup();
                  setIsSyncing(false);
                  fetchTickets(true);
                  return;
                }
              } else {
                lastSyncId = data.lastSync?.id;
                noChangeCount = 0;
              }
            }
          } catch (pollError) {
            console.error("Error polling sync status:", pollError);
          }
        }, 2000);

        // Timeout after 15 minutes
        timeoutId = setTimeout(() => {
          console.log("Sync timeout reached (15min)");
          cleanup();
          setIsSyncing(false);
          fetchTickets(true);
        }, 15 * 60 * 1000);
      } else {
        // Unexpected error
        const errorText = await response.text();
        console.error("Error starting sync:", errorText);
        setIsSyncing(false);
      }
    } catch (error) {
      console.error("Error triggering sync:", error);
      cleanup();
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
      fetchSyncStatus();
      checkAdmin();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status, fetchTickets, fetchSyncStatus, checkAdmin]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative w-16 h-16">
              <div className="rocket text-4xl">🚀</div>
            </div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">
            {t("loadingTickets")}
          </div>
          <div className="text-sm text-gray-500">
            {language === "nl" && "Even geduld..."}
            {language === "fr" && "Veuillez patienter..."}
            {language === "en" && "Please wait..."}
          </div>
        </div>

        <style jsx>{`
          .rocket {
            animation: bounce 1s ease-in-out infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
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
        <div className="mb-4">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1"
          >
            ← {language === "nl" ? "Terug" : language === "fr" ? "Retour" : "Back"}
          </Link>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("myTicketsTitle")}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {metadata && (
                <p className="text-sm text-gray-600">
                  {metadata.userTicketsFound} {t("ticketsWord")}
                  {metadata.totalTasksSearched > 0 && (
                    <span className="text-gray-400">
                      {" "}/ {metadata.totalTasksSearched} {language === "nl" ? "totaal" : language === "fr" ? "total" : "total"}
                    </span>
                  )}
                </p>
              )}
              {metadata?.lastSyncAt && (
                <p className="text-xs text-gray-500">
                  {language === "nl" && `Gesynchroniseerd: ${formatSyncTime(metadata.lastSyncAt, language)}`}
                  {language === "fr" && `Synchronisé: ${formatSyncTime(metadata.lastSyncAt, language)}`}
                  {language === "en" && `Synced: ${formatSyncTime(metadata.lastSyncAt, language)}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {/* Sync Buttons - Admin only */}
            {isAdmin && (
              <>
                <button
                  onClick={() => triggerSync(false)}
                  onDoubleClick={() => triggerSync(true)}
                  disabled={isSyncing}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  title={language === "nl" ? "Sync (dubbelklik = force)" : language === "fr" ? "Sync (double-clic = force)" : "Sync (double-click = force)"}
                >
                  <span className={isSyncing ? "animate-spin" : ""}>⚡</span>
                  {isSyncing ? (
                    <>
                      {language === "nl" && "Syncing..."}
                      {language === "fr" && "Syncing..."}
                      {language === "en" && "Syncing..."}
                    </>
                  ) : (
                    <>
                      {language === "nl" && "Sync"}
                      {language === "fr" && "Sync"}
                      {language === "en" && "Sync"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => fetchTickets(true)}
                  disabled={isRefreshing}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  title={language === "nl" ? "Ververs lijst" : language === "fr" ? "Actualiser la liste" : "Refresh list"}
                >
                  <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
                </button>
              </>
            )}
            <Link
              href="/tickets/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              {t("newTicketButton")}
            </Link>
          </div>
        </div>

        {/* Sync Status Banner - Admin only */}
        {isAdmin && isSyncing && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="animate-spin text-blue-600">⚡</div>
            <div className="text-sm text-blue-700">
              {language === "nl" && "Tickets worden gesynchroniseerd met ClickUp..."}
              {language === "fr" && "Synchronisation des tickets avec ClickUp..."}
              {language === "en" && "Syncing tickets with ClickUp..."}
            </div>
          </div>
        )}

        <TicketList tickets={tickets} />
      </main>
    </div>
  );
}
