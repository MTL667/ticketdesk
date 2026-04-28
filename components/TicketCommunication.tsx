"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TicketComments } from "@/components/TicketComments";
import { JiraTicketComments } from "@/components/JiraTicketComments";

interface TicketCommunicationProps {
  ticketId: string;
  jiraUrl: string | null;
  userEmail: string;
  userName: string;
}

export function TicketCommunication({ ticketId, jiraUrl, userEmail, userName }: TicketCommunicationProps) {
  const { t } = useLanguage();
  const hasJira = !!jiraUrl;
  const [activeView, setActiveView] = useState<"developer" | "previous">(
    hasJira ? "developer" : "previous"
  );
  const [jiraUnread, setJiraUnread] = useState(0);
  const [clickupUnread, setClickupUnread] = useState(0);

  const handleJiraUnread = useCallback((count: number) => {
    if (activeView !== "developer") {
      setJiraUnread((prev) => prev + count);
    }
  }, [activeView]);

  const handleClickupUnread = useCallback((count: number) => {
    if (activeView !== "previous") {
      setClickupUnread((prev) => prev + count);
    }
  }, [activeView]);

  const switchView = (view: "developer" | "previous") => {
    setActiveView(view);
    if (view === "developer") setJiraUnread(0);
    if (view === "previous") setClickupUnread(0);
  };

  if (!hasJira) {
    return <TicketComments ticketId={ticketId} userEmail={userEmail} />;
  }

  return (
    <div>
      <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => switchView("developer")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
            activeView === "developer"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          💬 {t("developerMessages") || "Ontwikkelaar"}
          {jiraUnread > 0 && activeView !== "developer" && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {jiraUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => switchView("previous")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
            activeView === "previous"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📋 {t("previousConversations") || "Eerdere gesprekken"}
          {clickupUnread > 0 && activeView !== "previous" && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {clickupUnread}
            </span>
          )}
        </button>
      </div>

      <div className={activeView === "developer" ? "block" : "hidden"}>
        <JiraTicketComments
          ticketId={ticketId}
          userEmail={userEmail}
          userName={userName}
          onUnreadCount={handleJiraUnread}
        />
      </div>
      <div className={activeView === "previous" ? "block" : "hidden"}>
        <TicketComments ticketId={ticketId} userEmail={userEmail} />
      </div>
    </div>
  );
}
