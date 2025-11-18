import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTask, filterTasksByEmail } from "@/lib/clickup";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const task = await getTask(id);

    // Verify task belongs to user
    const userTasks = filterTasksByEmail([task], session.user.email);
    if (userTasks.length === 0) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    // Extract Ticket ID from custom field
    const TICKET_ID_FIELD_ID = "faadba80-e7bc-474e-b01c-1a1c965c9a76";
    const ticketIdField = task.custom_fields?.find(f => f.id === TICKET_ID_FIELD_ID);
    const ticketId = ticketIdField?.value as string | undefined;

    const description = task.description || "";

    const ticket = {
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

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching ticket" },
      { status: 500 }
    );
  }
}


