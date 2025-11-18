import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTasks, filterTasksByEmail } from "@/lib/clickup";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tasks = await getTasks();
    
    // Filter tasks by email (looks in custom fields and description)
    const userTasks = filterTasksByEmail(tasks, session.user.email);

    // Map to ticket format
    const tickets = userTasks.map((task) => {
      // Extract Ticket ID from custom field
      const TICKET_ID_FIELD_ID = "faadba80-e7bc-474e-b01c-1a1c965c9a76";
      const ticketIdField = task.custom_fields?.find(f => f.id === TICKET_ID_FIELD_ID);
      const ticketId = ticketIdField?.value as string | undefined;

      return {
        id: task.id,
        ticketId,
        name: task.name,
        description: task.description,
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

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching tickets" },
      { status: 500 }
    );
  }
}

