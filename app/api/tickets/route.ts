import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTask, getTasks, filterTasksByEmail, uploadAttachment } from "@/lib/clickup";

// Priority mapping
const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

// Map Dutch/French values to readable strings
const TYPE_VRAAG_MAP: Record<string, string> = {
  damage: "Schade & problemen / Dommages et problèmes",
  new: "Nieuwe vraag / Nouvelle demande",
  info: "Informatie / Information",
  other: "Andere / Autres",
};

const GEBOUW_MAP: Record<string, string> = {
  "strombeek-bever": "Strombeek-Bever",
  destelbergen: "Destelbergen",
  utrecht: "Utrecht",
  "aceg-drive-in": "ACEG Drive-in",
  other: "Andere / Autres",
};

const TOEPASSINGSGEBIED_MAP: Record<string, string> = {
  werkplek: "Werkplek / Lieu de travail",
  gebouwschil: "Gebouwschil / Enveloppe du bâtiment",
  sanitair: "Sanitair / Sanitaire",
  elektriciteit: "Elektriciteit / Électricité",
  keuken: "Keuken / Cuisine",
  verwarming: "Verwarming / Chauffage",
  "drank-koffie": "Drank/koffie / Boissons/Café",
  parking: "Parking",
  other: "Andere / Autres",
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Extract form fields
    const typeVraag = formData.get("typeVraag") as string;
    const typeVraagOther = formData.get("typeVraagOther") as string | null;
    const gebouw = formData.get("gebouw") as string;
    const gebouwOther = formData.get("gebouwOther") as string | null;
    const toepassingsgebied = formData.get("toepassingsgebied") as string;
    const toepassingsgebiedOther = formData.get("toepassingsgebiedOther") as string | null;
    const korteOmschrijving = formData.get("korteOmschrijving") as string;
    const volledigeOmschrijving = formData.get("volledigeOmschrijving") as string;
    const prioriteit = formData.get("prioriteit") as string;

    // Validate required fields
    if (!typeVraag || !gebouw || !toepassingsgebied || !korteOmschrijving || !volledigeOmschrijving || !prioriteit) {
      return NextResponse.json(
        { message: "Alle verplichte velden moeten worden ingevuld" },
        { status: 400 }
      );
    }

    // Build description with all ticket data
    const typeVraagDisplay = typeVraag === "other" && typeVraagOther
      ? `Andere: ${typeVraagOther}`
      : TYPE_VRAAG_MAP[typeVraag] || typeVraag;

    const gebouwDisplay = gebouw === "other" && gebouwOther
      ? `Andere: ${gebouwOther}`
      : GEBOUW_MAP[gebouw] || gebouw;

    const toepassingsgebiedDisplay = toepassingsgebied === "other" && toepassingsgebiedOther
      ? `Andere: ${toepassingsgebiedOther}`
      : TOEPASSINGSGEBIED_MAP[toepassingsgebied] || toepassingsgebied;

    const description = `
${volledigeOmschrijving}

---
Ticket Details:
Type vraag / Type de demande: ${typeVraagDisplay}
Gebouw / Bâtiment: ${gebouwDisplay}
Toepassingsgebied / Application: ${toepassingsgebiedDisplay}
Prioriteit / Priorité: ${prioriteit}
Requester Email: ${session.user.email}
Tenant ID: ${session.user.tenantId || "N/A"}
    `.trim();

    // Build custom fields array for ClickUp
    const customFields: Array<{ id: string; value: string | number }> = [];

    // Note: For dropdown fields in ClickUp, we need to send the option ID or orderindex
    // The form now sends the actual ClickUp option ID/orderindex as the value
    // So we can use the raw values from the form for dropdown fields
    
    // Add Type Vraag custom field
    if (process.env.CLICKUP_FIELD_TYPE_VRAAG) {
      // Use the form value if it looks like a ClickUp ID/orderindex (not a fallback value)
      const isClickUpValue = !["damage", "new", "info", "other"].includes(typeVraag);
      customFields.push({
        id: process.env.CLICKUP_FIELD_TYPE_VRAAG,
        value: isClickUpValue ? typeVraag : typeVraagDisplay,
      });
    }

    // Add Gebouw custom field
    if (process.env.CLICKUP_FIELD_GEBOUW) {
      const isClickUpValue = !["strombeek-bever", "destelbergen", "utrecht", "aceg-drive-in", "other"].includes(gebouw);
      customFields.push({
        id: process.env.CLICKUP_FIELD_GEBOUW,
        value: isClickUpValue ? gebouw : gebouwDisplay,
      });
    }

    // Add Toepassingsgebied custom field
    if (process.env.CLICKUP_FIELD_TOEPASSINGSGEBIED) {
      const isClickUpValue = !["werkplek", "gebouwschil", "sanitair", "elektriciteit", "keuken", "verwarming", "drank-koffie", "parking", "other"].includes(toepassingsgebied);
      customFields.push({
        id: process.env.CLICKUP_FIELD_TOEPASSINGSGEBIED,
        value: isClickUpValue ? toepassingsgebied : toepassingsgebiedDisplay,
      });
    }

    // Add Requester Email custom field
    if (process.env.CLICKUP_FIELD_REQUESTER_EMAIL) {
      customFields.push({
        id: process.env.CLICKUP_FIELD_REQUESTER_EMAIL,
        value: session.user.email,
      });
    }

    // Create task in ClickUp
    const taskData = {
      name: korteOmschrijving,
      description: description,
      priority: PRIORITY_MAP[prioriteit] || 3,
      status: "to do",
      custom_fields: customFields.length > 0 ? customFields : undefined,
    };

    const createdTask = await createTask(taskData);

    // Extract attachments
    const attachments: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("attachment_") && value instanceof File) {
        attachments.push(value);
      }
    }

    // Upload attachments
    for (const file of attachments) {
      try {
        await uploadAttachment(createdTask.id, file);
      } catch (error) {
        console.error(`Error uploading attachment ${file.name}:`, error);
        // Continue with other attachments even if one fails
      }
    }

    return NextResponse.json({
      id: createdTask.id,
      name: createdTask.name,
      status: createdTask.status?.status || "unknown",
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error creating ticket" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tasks = await getTasks();
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


