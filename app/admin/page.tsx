"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState("");
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [bannerUpdatedAt, setBannerUpdatedAt] = useState<string | null>(null);
  const [bannerUpdatedBy, setBannerUpdatedBy] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      checkAdmin();
      fetchBanner();
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
      </main>
    </div>
  );
}

