import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewTicketPage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const clickupFormUrl = process.env.NEXT_PUBLIC_CLICKUP_FORM_URL;

  if (!clickupFormUrl) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                Gebouwbeheer Ticket Portal
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{session.user?.email}</span>
                <Link
                  href="/api/auth/signout"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Uitloggen
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              ClickUp Formulier URL niet geconfigureerd
            </h2>
            <p className="text-red-700">
              De environment variable <code className="bg-red-100 px-2 py-1 rounded">NEXT_PUBLIC_CLICKUP_FORM_URL</code> is niet ingesteld.
              Configureer deze in Easypanel om het formulier te kunnen tonen.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              ← Terug naar home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Pre-fill de email via URL parameter
  const userEmail = session.user?.email || "";
  const separator = clickupFormUrl.includes("?") ? "&" : "?";
  const prefilledFormUrl = `${clickupFormUrl}${separator}Contact Email=${encodeURIComponent(userEmail)}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800"
              >
                ← Terug
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Nieuw Ticket Aanmaken
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Uitloggen
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-blue-800">
              <strong>✓ E-mailadres automatisch ingevuld:</strong>{" "}
              <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                {session.user?.email}
              </span>
            </p>
          </div>
        </div>
        <iframe
          src={prefilledFormUrl}
          className="w-full flex-1 border-0"
          style={{ minHeight: "calc(100vh - 112px)" }}
          title="ClickUp Ticket Form"
          allowFullScreen
        />
      </main>
    </div>
  );
}
