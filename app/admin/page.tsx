"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface ZabbixHost {
  id: string;
  name: string;
  host: string;
  enabled: boolean;
}

interface MonitoredService {
  id: string;
  name: string;
  zabbixHostId: string | null;
  zabbixHostName: string | null;
  manualStatus: string | null;
  manualMessage: string | null;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Banner state
  const [bannerMessage, setBannerMessage] = useState("");
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [bannerUpdatedAt, setBannerUpdatedAt] = useState<string | null>(null);
  const [bannerUpdatedBy, setBannerUpdatedBy] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Zabbix state
  const [zabbixConfigured, setZabbixConfigured] = useState(false);
  const [zabbixConnected, setZabbixConnected] = useState(false);
  const [zabbixVersion, setZabbixVersion] = useState<string | null>(null);
  const [zabbixHosts, setZabbixHosts] = useState<ZabbixHost[]>([]);
  const [zabbixError, setZabbixError] = useState<string | null>(null);
  
  // Services state
  const [services, setServices] = useState<MonitoredService[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [selectedHostId, setSelectedHostId] = useState("");
  const [isAddingService, setIsAddingService] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      checkAdmin();
      fetchBanner();
      fetchZabbixInfo();
      fetchServices();
    } else if (status === "unauthenticated") {
      redirect("/signin");
    }
  }, [status]);

  const checkAdmin = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();
      setIsAdmin(data.isAdmin);
      if (!data.isAdmin) {
        redirect("/");
      }
    } catch (error) {
      console.error("Error checking admin:", error);
      redirect("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBanner = async () => {
    try {
      const response = await fetch("/api/settings/banner");
      if (response.ok) {
        const data = await response.json();
        setCurrentBanner(data.banner);
        setBannerMessage(data.banner || "");
        setBannerUpdatedAt(data.updatedAt);
        setBannerUpdatedBy(data.updatedBy);
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  };

  const fetchZabbixInfo = async () => {
    try {
      const response = await fetch("/api/admin/zabbix");
      if (response.ok) {
        const data = await response.json();
        setZabbixConfigured(data.configured || false);
        setZabbixConnected(data.connected || false);
        setZabbixVersion(data.version || null);
        setZabbixHosts(data.hosts || []);
        setZabbixError(data.message && !data.connected ? data.message : null);
      }
    } catch (error) {
      console.error("Error fetching Zabbix info:", error);
      setZabbixError("Error connecting to Zabbix");
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/admin/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const addService = async () => {
    if (!newServiceName.trim()) return;
    
    setIsAddingService(true);
    try {
      const selectedHost = zabbixHosts.find(h => h.id === selectedHostId);
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newServiceName.trim(),
          zabbixHostId: selectedHostId || null,
          zabbixHostName: selectedHost?.name || null,
        }),
      });
      
      if (response.ok) {
        setNewServiceName("");
        setSelectedHostId("");
        fetchServices();
      }
    } catch (error) {
      console.error("Error adding service:", error);
    } finally {
      setIsAddingService(false);
    }
  };

  const updateServiceStatus = async (serviceId: string, manualStatus: string | null, manualMessage: string | null) => {
    try {
      await fetch(`/api/admin/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualStatus, manualMessage }),
      });
      fetchServices();
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm(language === "nl" ? "Weet je zeker dat je deze service wilt verwijderen?" : "Are you sure you want to delete this service?")) {
      return;
    }
    
    try {
      await fetch(`/api/admin/services/${serviceId}`, { method: "DELETE" });
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const saveBanner = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/settings/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: bannerMessage.trim() || null }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentBanner(data.banner);
        setBannerUpdatedAt(data.updatedAt);
        setBannerUpdatedBy(data.updatedBy);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving banner:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const clearBanner = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/banner", { method: "DELETE" });
      if (response.ok) {
        setCurrentBanner(null);
        setBannerMessage("");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error clearing banner:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString(
      language === "nl" ? "nl-BE" : language === "fr" ? "fr-BE" : "en-US"
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-xl font-semibold text-gray-700">
            {language === "nl" ? "Laden..." : language === "fr" ? "Chargement..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null;
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
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                ADMIN
              </span>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1"
          >
            ← {language === "nl" ? "Terug" : language === "fr" ? "Retour" : "Back"}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {language === "nl" ? "Admin Panel" : language === "fr" ? "Panneau d'administration" : "Admin Panel"}
        </h1>

        {/* Banner Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📢 {language === "nl" ? "Homepage Banner" : language === "fr" ? "Bannière de la page d'accueil" : "Homepage Banner"}
          </h2>
          
          <div className="space-y-4">
            {/* Current Banner Preview */}
            {currentBanner && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">
                  {language === "nl" ? "Huidige banner:" : language === "fr" ? "Bannière actuelle:" : "Current banner:"}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-800">
                  {currentBanner}
                </div>
                {bannerUpdatedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {language === "nl" ? "Laatst bijgewerkt:" : language === "fr" ? "Dernière mise à jour:" : "Last updated:"} {formatDate(bannerUpdatedAt)}
                    {bannerUpdatedBy && ` door ${bannerUpdatedBy}`}
                  </p>
                )}
              </div>
            )}

            {/* Banner Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "nl" ? "Bericht" : language === "fr" ? "Message" : "Message"}
              </label>
              <textarea
                value={bannerMessage}
                onChange={(e) => setBannerMessage(e.target.value)}
                placeholder={
                  language === "nl" ? "Voer een bericht in om op de homepage te tonen..." :
                  language === "fr" ? "Entrez un message à afficher sur la page d'accueil..." :
                  "Enter a message to display on the homepage..."
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === "nl" ? "Laat leeg om de banner te verbergen" : 
                 language === "fr" ? "Laissez vide pour masquer la bannière" : 
                 "Leave empty to hide the banner"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={saveBanner}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {isSaving ? (
                  language === "nl" ? "Opslaan..." : language === "fr" ? "Enregistrement..." : "Saving..."
                ) : (
                  language === "nl" ? "Opslaan" : language === "fr" ? "Enregistrer" : "Save"
                )}
              </button>
              
              {currentBanner && (
                <button
                  onClick={clearBanner}
                  disabled={isSaving}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  {language === "nl" ? "Verwijderen" : language === "fr" ? "Supprimer" : "Clear"}
                </button>
              )}

              {saveSuccess && (
                <span className="text-green-600 text-sm">
                  ✓ {language === "nl" ? "Opgeslagen!" : language === "fr" ? "Enregistré!" : "Saved!"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* System Status Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📊 {language === "nl" ? "Systeem Status" : language === "fr" ? "État du Système" : "System Status"}
          </h2>

          {/* Zabbix Connection Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Zabbix {language === "nl" ? "Verbinding" : language === "fr" ? "Connexion" : "Connection"}
            </h3>
            {!zabbixConfigured ? (
              <div className="text-sm text-gray-500">
                <p className="mb-2">⚠️ {language === "nl" ? "Niet geconfigureerd" : "Not configured"}</p>
                <p className="text-xs">
                  {language === "nl" 
                    ? "Stel ZABBIX_URL en ZABBIX_API_TOKEN in als environment variabelen."
                    : "Set ZABBIX_URL and ZABBIX_API_TOKEN as environment variables."}
                </p>
              </div>
            ) : zabbixConnected ? (
              <div className="text-sm text-green-600">
                ✓ {language === "nl" ? "Verbonden" : "Connected"} {zabbixVersion && `(v${zabbixVersion})`}
                <span className="text-gray-500 ml-2">
                  - {zabbixHosts.length} hosts {language === "nl" ? "gevonden" : "found"}
                </span>
              </div>
            ) : (
              <div className="text-sm text-red-600">
                ✗ {language === "nl" ? "Verbinding mislukt" : "Connection failed"}
                {zabbixError && <p className="text-xs mt-1">{zabbixError}</p>}
              </div>
            )}
          </div>

          {/* Add New Service */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {language === "nl" ? "Service Toevoegen" : language === "fr" ? "Ajouter un Service" : "Add Service"}
            </h3>
            <div className="space-y-3">
              {/* Step 1: Select Zabbix Host */}
              {zabbixConnected && zabbixHosts.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    1. {language === "nl" ? "Selecteer Zabbix Host" : "Select Zabbix Host"}
                  </label>
                  <select
                    value={selectedHostId}
                    onChange={(e) => {
                      setSelectedHostId(e.target.value);
                      // Auto-fill name with host name if empty
                      if (e.target.value && !newServiceName) {
                        const host = zabbixHosts.find(h => h.id === e.target.value);
                        if (host) setNewServiceName(host.name);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === "nl" ? "-- Kies een host --" : "-- Select a host --"}</option>
                    {zabbixHosts.filter(h => h.enabled).map((host) => (
                      <option key={host.id} value={host.id}>
                        {host.name} ({host.host})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Step 2: Custom Display Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {zabbixConnected ? "2. " : ""}{language === "nl" ? "Weergavenaam (zichtbaar op homepage)" : "Display name (visible on homepage)"}
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder={language === "nl" ? "bijv. Formulieren, SAP, Email..." : "e.g., Forms, SAP, Email..."}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addService}
                    disabled={isAddingService || !newServiceName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap"
                  >
                    {isAddingService ? "..." : language === "nl" ? "Toevoegen" : "Add"}
                  </button>
                </div>
                {selectedHostId && (
                  <p className="text-xs text-gray-400 mt-1">
                    🔗 {language === "nl" ? "Gekoppeld aan Zabbix host:" : "Linked to Zabbix host:"} {zabbixHosts.find(h => h.id === selectedHostId)?.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Services List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {language === "nl" ? "Gemonitorde Services" : language === "fr" ? "Services Surveillés" : "Monitored Services"}
              {services.length > 0 && <span className="text-gray-400 font-normal"> ({services.length})</span>}
            </h3>
            
            {services.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {language === "nl" ? "Nog geen services toegevoegd" : "No services added yet"}
              </p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{service.name}</span>
                        {service.zabbixHostName && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Zabbix: {service.zabbixHostName}
                          </span>
                        )}
                        {service.manualStatus && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            service.manualStatus === "ok" ? "bg-green-100 text-green-700" :
                            service.manualStatus === "warning" ? "bg-yellow-100 text-yellow-700" :
                            service.manualStatus === "critical" ? "bg-orange-100 text-orange-700" :
                            service.manualStatus === "down" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {language === "nl" ? "Handmatig:" : "Manual:"} {service.manualStatus}
                          </span>
                        )}
                      </div>
                      {service.manualMessage && (
                        <p className="text-xs text-gray-500 mt-1">{service.manualMessage}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Manual Status Override */}
                      <select
                        value={service.manualStatus || ""}
                        onChange={(e) => updateServiceStatus(service.id, e.target.value || null, service.manualMessage)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">{language === "nl" ? "Auto (Zabbix)" : "Auto (Zabbix)"}</option>
                        <option value="ok">🟢 OK</option>
                        <option value="warning">🟡 Warning</option>
                        <option value="critical">🟠 Critical</option>
                        <option value="down">🔴 Down</option>
                      </select>
                      <button
                        onClick={() => deleteService(service.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-2"
                        title={language === "nl" ? "Verwijderen" : "Delete"}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


