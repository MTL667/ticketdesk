"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

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
  app?: string;
  jiraStatus?: string;
}

interface ReleaseListProps {
  releases: Release[];
}

function formatDate(dateString: string | null | undefined, language: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(parseInt(dateString));
    return new Intl.DateTimeFormat(language === 'nl' ? 'nl-BE' : language === 'fr' ? 'fr-BE' : 'en-US', {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("complete") || statusLower.includes("closed")) {
    return { bg: "bg-green-500", text: "text-white", label: status };
  }
  if (statusLower.includes("cancel")) {
    return { bg: "bg-gray-500", text: "text-white", label: status };
  }
  if (statusLower.includes("progress") || statusLower.includes("doing") || statusLower.includes("development")) {
    return { bg: "bg-purple-500", text: "text-white", label: status };
  }
  if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("review") || statusLower.includes("feedback")) {
    return { bg: "bg-yellow-500", text: "text-white", label: status };
  }
  if (statusLower.includes("new") || statusLower.includes("open") || statusLower.includes("to do")) {
    return { bg: "bg-blue-500", text: "text-white", label: status };
  }
  return { bg: "bg-gray-500", text: "text-white", label: status };
}

export function ReleaseList({ releases }: ReleaseListProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const ITEMS_PER_PAGE = 15;

  // Get unique business units
  const businessUnits = useMemo(() => {
    const units = new Set<string>();
    releases.forEach(r => {
      if (r.businessUnit) units.add(r.businessUnit);
    });
    return Array.from(units).sort();
  }, [releases]);

  // Get unique apps
  const apps = useMemo(() => {
    const appSet = new Set<string>();
    releases.forEach(r => {
      if (r.app) appSet.add(r.app);
    });
    return Array.from(appSet).sort();
  }, [releases]);

  // Get unique months from due dates
  const months = useMemo(() => {
    const monthSet = new Map<string, string>();
    releases.forEach(r => {
      if (r.dueDate) {
        const date = new Date(parseInt(r.dueDate));
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = new Intl.DateTimeFormat(language === 'nl' ? 'nl-BE' : language === 'fr' ? 'fr-BE' : 'en-US', {
          month: 'long',
          year: 'numeric',
        }).format(date);
        monthSet.set(key, label);
      }
    });
    return Array.from(monthSet.entries()).sort((a, b) => b[0].localeCompare(a[0])); // newest first
  }, [releases, language]);

  // Filter releases
  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      // Business Unit filter
      if (selectedBusinessUnit && release.businessUnit !== selectedBusinessUnit) {
        return false;
      }
      
      // App filter
      if (selectedApp && release.app !== selectedApp) {
        return false;
      }
      
      // Month filter
      if (selectedMonth && release.dueDate) {
        const date = new Date(parseInt(release.dueDate));
        const releaseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (releaseMonth !== selectedMonth) {
          return false;
        }
      } else if (selectedMonth && !release.dueDate) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          release.name.toLowerCase().includes(query) ||
          release.description.toLowerCase().includes(query) ||
          release.ticketId?.toLowerCase().includes(query) ||
          release.status.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [releases, searchQuery, selectedBusinessUnit, selectedApp, selectedMonth]);

  const hasActiveFilters = selectedBusinessUnit || selectedApp || selectedMonth;

  const clearFilters = () => {
    setSelectedBusinessUnit("");
    setSelectedApp("");
    setSelectedMonth("");
    setCurrentPage(1);
  };

  // Paginate
  const totalPages = Math.ceil(filteredReleases.length / ITEMS_PER_PAGE);
  const paginatedReleases = filteredReleases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder={
              language === "nl" ? "Zoek releases op naam, ID of status..." :
              language === "fr" ? "Rechercher des releases..." :
              "Search releases..."
            }
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-gray-600">
            {language === "nl" ? "Filter:" : language === "fr" ? "Filtrer:" : "Filter:"}
          </span>
          
          {/* Business Unit Filter */}
          <select
            value={selectedBusinessUnit}
            onChange={(e) => handleFilterChange(setSelectedBusinessUnit)(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              🏢 {language === "nl" ? "Alle Business Units" : language === "fr" ? "Toutes les BU" : "All Business Units"}
            </option>
            {businessUnits.map(bu => (
              <option key={bu} value={bu}>{bu}</option>
            ))}
          </select>

          {/* App Filter */}
          <select
            value={selectedApp}
            onChange={(e) => handleFilterChange(setSelectedApp)(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              📱 {language === "nl" ? "Alle Apps" : language === "fr" ? "Toutes les apps" : "All Apps"}
            </option>
            {apps.map(app => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => handleFilterChange(setSelectedMonth)(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              📅 {language === "nl" ? "Alle maanden" : language === "fr" ? "Tous les mois" : "All months"}
            </option>
            {months.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            >
              ✕ {language === "nl" ? "Wis filters" : language === "fr" ? "Effacer" : "Clear"}
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-3 text-xs text-gray-500">
        {filteredReleases.length} {language === "nl" ? "van" : language === "fr" ? "sur" : "of"} {releases.length} releases
        {hasActiveFilters && (
          <span className="text-blue-600 ml-1">
            ({language === "nl" ? "gefilterd" : language === "fr" ? "filtré" : "filtered"})
          </span>
        )}
      </p>

      {/* Release List */}
      {paginatedReleases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
          <p className="text-gray-600 mb-2">
            {language === "nl" && "Geen releases gevonden"}
            {language === "fr" && "Aucune release trouvée"}
            {language === "en" && "No releases found"}
          </p>
          <p className="text-sm text-gray-500">
            {language === "nl" && "Releases verschijnen hier wanneer tickets 'Release notes' = true hebben"}
            {language === "fr" && "Les releases apparaîtront ici quand les tickets ont 'Release notes' = true"}
            {language === "en" && "Releases will appear here when tickets have 'Release notes' = true"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedReleases.map((release) => {
              const statusStyle = getStatusStyle(release.status);
              
              return (
                <Link
                  key={release.id}
                  href={`/releases/${release.id}`}
                  className="block bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    {/* Title and info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-sm">
                        {release.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        {release.ticketId && (
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {release.ticketId}
                          </span>
                        )}
                        {release.dueDate && (
                          <span className="text-orange-600 font-medium">
                            📅 {formatDate(release.dueDate, language)}
                          </span>
                        )}
                        {release.businessUnit && (
                          <span className="text-blue-600">
                            🏢 {release.businessUnit}
                          </span>
                        )}
                        {release.app && (
                          <span className="text-green-600">
                            📱 {release.app}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                      <span className="text-gray-400 text-sm">›</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← {language === "nl" ? "Vorige" : language === "fr" ? "Précédent" : "Previous"}
              </button>
              
              <span className="text-sm text-gray-600 px-3">
                {language === "nl" ? "Pagina" : language === "fr" ? "Page" : "Page"} {currentPage} {language === "nl" ? "van" : language === "fr" ? "sur" : "of"} {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === "nl" ? "Volgende" : language === "fr" ? "Suivant" : "Next"} →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}



