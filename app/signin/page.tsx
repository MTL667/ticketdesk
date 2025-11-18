"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

function SignInContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [callbackUrl, setCallbackUrl] = useState("/");

  useEffect(() => {
    const url = searchParams.get("callbackUrl");
    if (url) {
      setCallbackUrl(url);
    }
  }, [searchParams]);

  const handleSignIn = async () => {
    await signIn("azure-ad", { redirectTo: callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t("signInTitle")}
          </h2>
          <p className="text-gray-600 mb-8">
            {t("signInDescription")}
          </p>
        </div>

        <button
          onClick={handleSignIn}
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          {t("signInButton")}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          {t("signInFooter")}
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-xl font-semibold text-gray-700">
          Loading...
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

