"use client";

import { useEffect, useState } from "react";
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
}

const CACHE_KEY = "ticketdesk_tickets_cache";
const CACHE_TIMESTAMP_KEY = "ticketdesk_tickets_timestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function formatLastUpdated(date: Date, language: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
    return language === 'nl' ? 'zojuist' : language === 'fr' ? 'à l\'instant' : 'just now';
  } else if (diffMins < 60) {
    const minsText = language === 'nl' ? 'min geleden' : language === 'fr' ? 'min' : 'min ago';
    return `${diffMins} ${minsText}`;
  } else {
    return date.toLocaleTimeString(language === 'nl' ? 'nl-BE' : language === 'fr' ? 'fr-BE' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadTickets();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status]);

  const loadTickets = () => {
    // Try to load from cache first
    const cachedData = loadFromCache();
    if (cachedData) {
      setTickets(cachedData.tickets);
      setMetadata(cachedData.metadata);
      setLastUpdated(cachedData.timestamp);
      setIsLoading(false);
      console.log("Loaded tickets from cache");
    } else {
      // No cache or expired, fetch fresh data
      fetchTickets();
    }
  };

  const loadFromCache = (): { tickets: Ticket[], metadata: TicketsMetadata, timestamp: Date } | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      const timestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const cacheTime = new Date(timestamp);
        const now = new Date();
        const age = now.getTime() - cacheTime.getTime();
        
        // Check if cache is still valid (within 5 minutes)
        if (age < CACHE_DURATION) {
          const data = JSON.parse(cached);
          return {
            tickets: data.tickets,
            metadata: data.metadata,
            timestamp: cacheTime
          };
        }
      }
    } catch (error) {
      console.error("Error loading cache:", error);
    }
    return null;
  };

  const saveToCache = (tickets: Ticket[], metadata: TicketsMetadata | null) => {
    try {
      const now = new Date();
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ tickets, metadata }));
      sessionStorage.setItem(CACHE_TIMESTAMP_KEY, now.toISOString());
      setLastUpdated(now);
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  };

  const fetchTickets = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/tickets");
      if (response.ok) {
        const data = await response.json();
        const newTickets = data.tickets || data;
        const newMetadata = data.metadata || null;
        
        setTickets(newTickets);
        setMetadata(newMetadata);
        saveToCache(newTickets, newMetadata);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTickets(true);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Rocket Animation */}
          <div className="mb-6 flex justify-center">
            <div className="relative w-16 h-16">
              {/* Rocket */}
              <div className="rocket text-4xl">🚀</div>
              {/* Smoke Trail */}
              <div className="smoke-trail">
                <div className="smoke">💨</div>
                <div className="smoke">💨</div>
                <div className="smoke">💨</div>
              </div>
            </div>
          </div>
          
          <div className="text-xl font-semibold text-gray-700 mb-2">
            {t("loadingTickets")}
          </div>
          <div className="text-sm text-gray-500">
            {language === 'nl' && 'Zoekt in alle tickets...'}
            {language === 'fr' && 'Recherche dans tous les tickets...'}
            {language === 'en' && 'Searching all tickets...'}
          </div>
        </div>

        <style jsx>{`
          .rocket {
            position: absolute;
            animation: flyRocket 2s ease-in-out infinite;
          }
          
          .smoke-trail {
            position: absolute;
            left: -10px;
            top: 20px;
          }
          
          .smoke {
            position: absolute;
            animation: fadeSmoke 1.5s ease-out infinite;
            opacity: 0;
          }
          
          .smoke:nth-child(1) {
            animation-delay: 0s;
          }
          
          .smoke:nth-child(2) {
            animation-delay: 0.5s;
          }
          
          .smoke:nth-child(3) {
            animation-delay: 1s;
          }
          
          @keyframes flyRocket {
            0%, 100% {
              transform: translateX(0) translateY(0);
            }
            50% {
              transform: translateX(40px) translateY(-10px);
            }
          }
          
          @keyframes fadeSmoke {
            0% {
              opacity: 0.6;
              transform: translateX(0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateX(-30px) scale(0.5);
            }
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("myTicketsTitle")}</h1>
            <div className="flex items-center gap-3 mt-1">
              {metadata && (
                <p className="text-sm text-gray-600">
                  {language === 'nl' && `Doorzocht ${metadata.totalTasksSearched} tickets in ${metadata.listCount} ${metadata.listCount === 1 ? 'lijst' : 'lijsten'}`}
                  {language === 'fr' && `Recherché dans ${metadata.totalTasksSearched} tickets dans ${metadata.listCount} ${metadata.listCount === 1 ? 'liste' : 'listes'}`}
                  {language === 'en' && `Searched ${metadata.totalTasksSearched} tickets in ${metadata.listCount} ${metadata.listCount === 1 ? 'list' : 'lists'}`}
                </p>
              )}
              {lastUpdated && (
                <p className="text-xs text-gray-500">
                  {language === 'nl' && `Laatst ververst: ${formatLastUpdated(lastUpdated, language)}`}
                  {language === 'fr' && `Dernière mise à jour: ${formatLastUpdated(lastUpdated, language)}`}
                  {language === 'en' && `Last updated: ${formatLastUpdated(lastUpdated, language)}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={language === 'nl' ? 'Ververs tickets' : language === 'fr' ? 'Actualiser les tickets' : 'Refresh tickets'}
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              {isRefreshing ? (
                <>
                  {language === 'nl' && 'Verversen...'}
                  {language === 'fr' && 'Actualisation...'}
                  {language === 'en' && 'Refreshing...'}
                </>
              ) : (
                <>
                  {language === 'nl' && 'Ververs'}
                  {language === 'fr' && 'Actualiser'}
                  {language === 'en' && 'Refresh'}
                </>
              )}
            </button>
            <Link
              href="/tickets/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t("newTicketButton")}
            </Link>
          </div>
        </div>

        <TicketList tickets={tickets} />
      </main>
    </div>
  );
}
