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

export default function TicketsPage() {
  const { data: session, status } = useSession();
  const { t, language } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metadata, setMetadata] = useState<TicketsMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status]);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets");
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || data); // Support old and new format
        if (data.metadata) {
          setMetadata(data.metadata);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
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
            {metadata && (
              <p className="text-sm text-gray-600 mt-1">
                {language === 'nl' && `Doorzocht ${metadata.totalTasksSearched} tickets in ${metadata.listCount} ${metadata.listCount === 1 ? 'lijst' : 'lijsten'}`}
                {language === 'fr' && `Recherché dans ${metadata.totalTasksSearched} tickets dans ${metadata.listCount} ${metadata.listCount === 1 ? 'liste' : 'listes'}`}
                {language === 'en' && `Searched ${metadata.totalTasksSearched} tickets in ${metadata.listCount} ${metadata.listCount === 1 ? 'list' : 'lists'}`}
              </p>
            )}
          </div>
          <Link
            href="/tickets/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t("newTicketButton")}
          </Link>
        </div>

        <TicketList tickets={tickets} />
      </main>
    </div>
  );
}
