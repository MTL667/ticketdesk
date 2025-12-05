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

    // Custom field IDs
    const TICKET_ID_FIELD_ID = "faadba80-e7bc-474e-b01c-1a1c965c9a76";
    
    // Helper to extract custom field value by name (case-insensitive)
    const getCustomFieldByName = (fields: any[] | undefined, name: string) => {
      if (!fields) return undefined;
      const field = fields.find(f => f.name?.toLowerCase().includes(name.toLowerCase()));
      return field?.value as string | undefined;
    };

    const ticketIdField = task.custom_fields?.find(f => f.id === TICKET_ID_FIELD_ID);
    const ticketId = ticketIdField?.value as string | undefined;

    // Extract new fields from custom fields
    const businessUnit = getCustomFieldByName(task.custom_fields, "business unit");
    const jiraStatus = getCustomFieldByName(task.custom_fields, "jira status");
    const jiraAssignee = getCustomFieldByName(task.custom_fields, "jira assignee");
    const jiraUrl = getCustomFieldByName(task.custom_fields, "jira url") || 
                    getCustomFieldByName(task.custom_fields, "jira link");

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
      businessUnit,
      jiraStatus,
      jiraAssignee,
      jiraUrl,
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


