import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket } from "@/types";
import { getTasks, filterTasksByEmail } from "@/lib/clickup";

async function getTickets(): Promise<Ticket[]> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return [];
  }

  try {
    const tasks = await getTasks();
    const userTasks = filterTasksByEmail(tasks, session.user.email);

    // Map to ticket format
    const tickets: Ticket[] = userTasks.map((task) => {
      // Extract metadata from description
      const typeVraagMatch = task.description.match(/Type vraag[^:]*:\s*(.+)/i);
      const gebouwMatch = task.description.match(/Gebouw[^:]*:\s*(.+)/i);
      const toepassingsgebiedMatch = task.description.match(/Toepassingsgebied[^:]*:\s*(.+)/i);
      const prioriteitMatch = task.description.match(/Prioriteit[^:]*:\s*(\w+)/i);

      return {
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status?.status || "unknown",
        priority: prioriteitMatch ? prioriteitMatch[1] : task.priority?.priority || "normal",
        typeVraag: typeVraagMatch ? typeVraagMatch[1].trim() : undefined,
        gebouw: gebouwMatch ? gebouwMatch[1].trim() : undefined,
        toepassingsgebied: toepassingsgebiedMatch ? toepassingsgebiedMatch[1].trim() : undefined,
        dateCreated: task.date_created,
        dateUpdated: task.date_updated,
        attachments: task.attachments?.map((att) => ({
          id: att.id,
          url: att.url,
          title: att.title,
        })),
      };
    });

    return tickets;
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(parseInt(dateString));
    return new Intl.DateTimeFormat("nl-BE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("complete")) {
    return "bg-green-100 text-green-800";
  }
  if (statusLower.includes("progress") || statusLower.includes("doing")) {
    return "bg-blue-100 text-blue-800";
  }
  if (statusLower.includes("waiting") || statusLower.includes("pending")) {
    return "bg-yellow-100 text-yellow-800";
  }
  if (statusLower.includes("closed") || statusLower.includes("cancel")) {
    return "bg-gray-100 text-gray-800";
  }
  return "bg-gray-100 text-gray-800";
}

function getPriorityColor(priority: string): string {
  const priorityLower = priority.toLowerCase();
  if (priorityLower === "urgent") {
    return "bg-red-100 text-red-800";
  }
  if (priorityLower === "high") {
    return "bg-orange-100 text-orange-800";
  }
  if (priorityLower === "normal") {
    return "bg-blue-100 text-blue-800";
  }
  if (priorityLower === "low") {
    return "bg-gray-100 text-gray-800";
  }
  return "bg-gray-100 text-gray-800";
}

export default async function TicketsPage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const tickets = await getTickets();

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mijn Tickets</h1>
          <Link
            href="/tickets/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Nieuw Ticket
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">U heeft nog geen tickets aangemaakt.</p>
            <Link
              href="/tickets/new"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Maak uw eerste ticket aan →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {ticket.name}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority || "normal")}`}>
                        {ticket.priority || "normal"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {ticket.typeVraag && (
                        <p>
                          <span className="font-medium">Type:</span> {ticket.typeVraag}
                        </p>
                      )}
                      {ticket.gebouw && (
                        <p>
                          <span className="font-medium">Gebouw:</span> {ticket.gebouw}
                        </p>
                      )}
                      {ticket.toepassingsgebied && (
                        <p>
                          <span className="font-medium">Toepassingsgebied:</span> {ticket.toepassingsgebied}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Aangemaakt:</span> {formatDate(ticket.dateCreated)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-400">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

