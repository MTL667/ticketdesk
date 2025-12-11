"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ServiceStatus {
  id: string;
  name: string;
  status: "ok" | "warning" | "critical" | "down" | "unknown";
  message?: string;
  problemCount?: number;
  isManual: boolean;
}

interface SystemStatusData {
  services: ServiceStatus[];
  configured: boolean;
  zabbixConfigured?: boolean;
}

const statusConfig = {
  ok: {
    color: "bg-green-500",
    bgLight: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    icon: "🟢",
    label: { nl: "Operationeel", fr: "Opérationnel", en: "Operational" },
  },
  warning: {
    color: "bg-yellow-500",
    bgLight: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    icon: "🟡",
    label: { nl: "Waarschuwing", fr: "Avertissement", en: "Warning" },
  },
  critical: {
    color: "bg-orange-500",
    bgLight: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: "🟠",
    label: { nl: "Kritiek", fr: "Critique", en: "Critical" },
  },
  down: {
    color: "bg-red-500",
    bgLight: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: "🔴",
    label: { nl: "Storing", fr: "Panne", en: "Down" },
  },
  unknown: {
    color: "bg-gray-400",
    bgLight: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    icon: "⚪",
    label: { nl: "Onbekend", fr: "Inconnu", en: "Unknown" },
  },
};

export function SystemStatus() {
  const { language } = useLanguage();
  const [data, setData] = useState<SystemStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchStatus();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/status");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching system status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show anything if not configured or no services
  if (!isLoading && (!data?.configured || data.services.length === 0)) {
    return null;
  }

  // Calculate overall status
  const getOverallStatus = (): "ok" | "warning" | "critical" | "down" | "unknown" => {
    if (!data?.services.length) return "unknown";
    
    const statuses = data.services.map((s) => s.status);
    if (statuses.includes("down")) return "down";
    if (statuses.includes("critical")) return "critical";
    if (statuses.includes("warning")) return "warning";
    if (statuses.every((s) => s === "ok")) return "ok";
    return "unknown";
  };

  const overallStatus = getOverallStatus();
  const config = statusConfig[overallStatus];

  if (isLoading) {
    return (
      <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg px-6 py-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-8 ${config.bgLight} border ${config.border} rounded-lg overflow-hidden`}>
      {/* Header - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{config.icon}</span>
          <div className="text-left">
            <span className={`font-medium ${config.text}`}>
              {language === "nl" ? "Systeem Status" : language === "fr" ? "État du Système" : "System Status"}
            </span>
            <span className={`ml-2 text-sm ${config.text}`}>
              — {config.label[language as keyof typeof config.label]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.services && data.services.length > 0 && (
            <span className="text-xs text-gray-500">
              {data.services.length} {language === "nl" ? "services" : language === "fr" ? "services" : "services"}
            </span>
          )}
          <span className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && data?.services && (
        <div className="px-6 pb-4 border-t border-gray-200/50">
          <div className="mt-3 space-y-2">
            {data.services.map((service) => {
              const serviceConfig = statusConfig[service.status];
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between py-2 px-3 bg-white rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <span>{serviceConfig.icon}</span>
                    <span className="font-medium text-gray-900 text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.message && service.status !== "ok" && (
                      <span className="text-xs text-gray-500 max-w-[200px] truncate" title={service.message}>
                        {service.message}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${serviceConfig.bgLight} ${serviceConfig.text}`}>
                      {serviceConfig.label[language as keyof typeof serviceConfig.label]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-400 text-right">
            {language === "nl" ? "Vernieuwt elke minuut" : language === "fr" ? "Actualise chaque minute" : "Refreshes every minute"}
          </p>
        </div>
      )}
    </div>
  );
}

