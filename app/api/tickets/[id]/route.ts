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

    // Extract metadata from description
    const typeVraagMatch = task.description.match(/Type vraag[^:]*:\s*(.+)/i);
    const gebouwMatch = task.description.match(/Gebouw[^:]*:\s*(.+)/i);
    const toepassingsgebiedMatch = task.description.match(/Toepassingsgebied[^:]*:\s*(.+)/i);
    const prioriteitMatch = task.description.match(/Prioriteit[^:]*:\s*(\w+)/i);
    const requesterEmailMatch = task.description.match(/Requester Email:\s*(.+)/i);
    const tenantIdMatch = task.description.match(/Tenant ID:\s*(.+)/i);

    // Extract the main description (everything before the "---")
    const descriptionParts = task.description.split("---");
    const mainDescription = descriptionParts[0]?.trim() || task.description;

    const ticket = {
      id: task.id,
      name: task.name,
      description: mainDescription,
      fullDescription: task.description,
      status: task.status?.status || "unknown",
      priority: prioriteitMatch ? prioriteitMatch[1] : task.priority?.priority || "normal",
      typeVraag: typeVraagMatch ? typeVraagMatch[1].trim() : undefined,
      gebouw: gebouwMatch ? gebouwMatch[1].trim() : undefined,
      toepassingsgebied: toepassingsgebiedMatch ? toepassingsgebiedMatch[1].trim() : undefined,
      requesterEmail: requesterEmailMatch ? requesterEmailMatch[1].trim() : undefined,
      tenantId: tenantIdMatch ? tenantIdMatch[1].trim() : undefined,
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


