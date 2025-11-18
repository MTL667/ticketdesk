import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTask, filterTasksByEmail } from "@/lib/clickup";

interface TicketDetail {
  id: string;
  ticketId?: string; // Custom field: Ticket ID
  name: string;
  description: string;
  fullDescription: string;
  status: string;
  priority: string;
  dateCreated: string;
  dateUpdated: string;
  attachments?: Array<{
    id: string;
    url: string;
    title: string;
  }>;
}

async function getTicket(id: string): Promise<TicketDetail | null> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return null;
  }

  try {
    const task = await getTask(id);
    
    // Verify task belongs to user (checks custom fields and description)
    const userTasks = filterTasksByEmail([task], session.user.email);
    if (userTasks.length === 0) {
      console.log(`[TicketDetail] Access denied: Ticket ${id} does not belong to user ${session.user.email}`);
      return null;
    }

    // Extract the description
    const description = task.description || "";

    // Extract Ticket ID from custom field
    const TICKET_ID_FIELD_ID = "faadba80-e7bc-474e-b01c-1a1c965c9a76";
    const ticketIdField = task.custom_fields?.find(f => f.id === TICKET_ID_FIELD_ID);
    const ticketId = ticketIdField?.value as string | undefined;

    const ticket: TicketDetail = {
      id: task.id,
      ticketId,
      name: task.name,
      description: description,
      fullDescription: description,
      status: task.status?.status || "unknown",
      priority: task.priority?.priority || "normal",
      dateCreated: task.date_created,
      dateUpdated: task.date_updated,
      attachments: task.attachments?.map((att) => ({
        id: att.id,
        url: att.url,
        title: att.title,
      })),
    };

    console.log(`[TicketDetail] Successfully loaded ticket ${id} for user: ${session.user.email}`);
    return ticket;
  } catch (error) {
    console.error(`[TicketDetail] Error fetching ticket ${id}:`, error);
    if (error instanceof Error) {
      console.error(`[TicketDetail] Error details:`, error.message);
    }
    return null;
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

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                ServiceDesk
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket niet gevonden</h1>
            <p className="text-gray-600 mb-6">
              Dit ticket bestaat niet of u heeft geen toegang tot dit ticket.
            </p>
            <Link
              href="/tickets"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Terug naar Mijn Tickets
            </Link>
          </div>
        </main>
      </div>
    );
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
        <div className="mb-6">
          <Link
            href="/tickets"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Terug naar Mijn Tickets
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{ticket.name}</h1>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-6">
            {/* Ticket Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ticket Details
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ticket.ticketId && (
                  <>
                    <dt className="font-medium text-gray-700">Ticket ID</dt>
                    <dd className="text-gray-900">
                      <span className="font-mono text-lg bg-blue-50 text-blue-700 px-3 py-1 rounded font-semibold">{ticket.ticketId}</span>
                    </dd>
                  </>
                )}
                <dt className="font-medium text-gray-700">ClickUp ID</dt>
                <dd className="text-gray-900">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{ticket.id}</span>
                </dd>
                <dt className="font-medium text-gray-700">Prioriteit</dt>
                <dd className="text-gray-900 capitalize">{ticket.priority}</dd>
                <dt className="font-medium text-gray-700">Status</dt>
                <dd className="text-gray-900">{ticket.status}</dd>
                <dt className="font-medium text-gray-700">Aangemaakt op</dt>
                <dd className="text-gray-900">{formatDate(ticket.dateCreated)}</dd>
                <dt className="font-medium text-gray-700">Laatst bijgewerkt</dt>
                <dd className="text-gray-900">{formatDate(ticket.dateUpdated)}</dd>
              </dl>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Omschrijving
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Bijlagen
                </h2>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-gray-50"
                    >
                      <span>📎</span>
                      <span>{attachment.title || "Attachment"}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

