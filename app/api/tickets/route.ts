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
    
    // Show all tasks for now until ClickUp form is configured with email field
    // TODO: Filter by email once ClickUp form includes requester email in custom field
    const userTasks = tasks; // filterTasksByEmail(tasks, session.user.email);

    // Map to ticket format
    const tickets = userTasks.map((task) => {
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

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching tickets" },
      { status: 500 }
    );
  }
}


