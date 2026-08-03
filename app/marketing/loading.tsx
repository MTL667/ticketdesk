"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function MarketingLoading() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-lg font-semibold text-gray-700">
        {t("marketingLoading")}
      </div>
    </div>
  );
}
