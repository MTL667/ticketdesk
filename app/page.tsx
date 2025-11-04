import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Gebouwbeheer Ticket Portal
            </h1>
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
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welkom bij het Gebouwbeheer Ticket Systeem
          </h2>
          <p className="text-gray-600">
            Maak een nieuwe ticket aan of bekijk uw bestaande tickets.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Link
            href="/tickets/new"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nieuw Ticket Aanmaken
              </h3>
              <p className="text-gray-600">
                Dien een nieuwe gebouwbeheer aanvraag in
              </p>
            </div>
          </Link>

          <Link
            href="/tickets"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Mijn Tickets
              </h3>
              <p className="text-gray-600">
                Bekijk al uw bestaande tickets en hun status
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}


