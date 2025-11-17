import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTasks, filterTasksByEmail, createTask, uploadAttachment } from "@/lib/clickup";

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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const email = formData.get("email") as string;

    if (!name || !description) {
      return NextResponse.json(
        { message: "Name and description are required" },
        { status: 400 }
      );
    }

    // Validatie: email moet overeenkomen met de ingelogde gebruiker
    if (email !== session.user.email) {
      return NextResponse.json(
        { message: "Email must match logged in user" },
        { status: 403 }
      );
    }

    console.log(`[POST /api/tickets] Creating ticket for user: ${email}`);

    // Map priority to ClickUp priority (1=urgent, 2=high, 3=normal, 4=low)
    const priorityMap: { [key: string]: 1 | 2 | 3 | 4 } = {
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 4,
    };
    const clickupPriority = priorityMap[priority] || 3;

    // Custom field ID voor email
    const EMAIL_FIELD_ID = "e041d530-cb4e-4fd1-9759-9cb3f9a9cbe4";

    // Custom fields array
    const customFields = [
      {
        id: EMAIL_FIELD_ID,
        value: email,
      },
    ];

    // Maak de taak aan in ClickUp
    const task = await createTask({
      name,
      description,
      priority: clickupPriority,
      customFields,
    });

    console.log(`[POST /api/tickets] Created task ${task.id} with email custom field`);

    // Upload attachments
    const attachments = formData.getAll("attachments") as File[];
    if (attachments.length > 0) {
      console.log(`[POST /api/tickets] Uploading ${attachments.length} attachments...`);
      for (const file of attachments) {
        if (file.size > 0) {
          await uploadAttachment(task.id, file);
        }
      }
    }

    return NextResponse.json(
      {
        id: task.id,
        message: "Ticket created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/tickets] Error creating ticket:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error creating ticket" },
      { status: 500 }
    );
  }
}

