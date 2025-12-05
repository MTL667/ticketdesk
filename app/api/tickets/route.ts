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
    const totalTasksSearched = tasks.length;
    
    // Filter tasks by email (looks in custom fields and description)
    const userTasks = filterTasksByEmail(tasks, session.user.email);

    // Custom field IDs
    const TICKET_ID_FIELD_ID = "faadba80-e7bc-474e-b01c-1a1c965c9a76";
    
    // Helper to extract custom field value by name (case-insensitive)
    const getCustomFieldByName = (fields: any[] | undefined, name: string) => {
      if (!fields) return undefined;
      const field = fields.find(f => f.name?.toLowerCase().includes(name.toLowerCase()));
      return field?.value as string | undefined;
    };

    // Map to ticket format
    const tickets = userTasks.map((task) => {
      const ticketIdField = task.custom_fields?.find(f => f.id === TICKET_ID_FIELD_ID);
      const ticketId = ticketIdField?.value as string | undefined;

      // Extract new fields from custom fields
      const businessUnit = getCustomFieldByName(task.custom_fields, "business unit");
      const jiraStatus = getCustomFieldByName(task.custom_fields, "jira status");
      const jiraAssignee = getCustomFieldByName(task.custom_fields, "jira assignee");
      const jiraUrl = getCustomFieldByName(task.custom_fields, "jira url") || 
                      getCustomFieldByName(task.custom_fields, "jira link");

      return {
        id: task.id,
        ticketId,
        name: task.name,
        description: task.description,
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
    });

    return NextResponse.json({
      tickets,
      metadata: {
        totalTasksSearched,
        userTicketsFound: tickets.length,
        listCount: process.env.CLICKUP_LIST_IDS?.split(',').length || 1,
      }
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching tickets" },
      { status: 500 }
    );
  }
}

