import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket } from "@/types";
import { getTasks, filterTasksByEmail } from "@/lib/clickup";
import { TicketList } from "@/components/TicketList";

async function getTickets(): Promise<Ticket[]> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return [];
  }

  try {
    const tasks = await getTasks();
    
    console.log(`[Tickets] Fetched ${tasks.length} tasks from ClickUp for user: ${session.user.email}`);
    
    // Debug: Show custom fields for first task
    if (tasks.length > 0 && tasks[0].custom_fields) {
      console.log(`[Tickets] Sample task custom fields:`, tasks[0].custom_fields.map(f => ({ id: f.id, name: f.name, value: f.value })));
    }
    
    // Filter tasks by email (looks in custom fields and description)
    const userTasks = filterTasksByEmail(tasks, session.user.email);
    
    console.log(`[Tickets] Filtered to ${userTasks.length} tickets for user: ${session.user.email}`);

    // Map to ticket format
    const tickets: Ticket[] = userTasks.map((task) => {
      // Extract Ticket ID from custom field
      const TICKET_ID_FIELD_ID = "faadba80-e7bc-474e-b01c-1a1c965c9a76";
      const ticketIdField = task.custom_fields?.find(f => f.id === TICKET_ID_FIELD_ID);
      const ticketId = ticketIdField?.value as string | undefined;

      return {
        id: task.id,
        ticketId,
        name: task.name,
        description: task.description || "",
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
    });

    console.log(`[Tickets] Returning ${tickets.length} tickets`);
    return tickets;
  } catch (error) {
    console.error("[Tickets] Error fetching tickets:", error);
    if (error instanceof Error) {
      console.error("[Tickets] Error details:", error.message);
    }
    return [];
  }
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mijn Tickets</h1>
          <Link
            href="/tickets/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Nieuw Ticket
          </Link>
        </div>

        <TicketList tickets={tickets} />
      </main>
    </div>
  );
}

