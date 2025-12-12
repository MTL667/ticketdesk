import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

// Fetch and cache attachments from ClickUp
async function getAttachments(ticketId: string): Promise<Array<{ id: string; url: string; title: string }>> {
  // First check if we already have cached attachments
  const cachedAttachments = await prisma.attachment.findMany({
    where: { ticketId },
    orderBy: { dateAdded: "desc" },
  });

  if (cachedAttachments.length > 0) {
    return cachedAttachments.map(a => ({
      id: a.id,
      url: a.url,
      title: a.title,
    }));
  }

  // Fetch from ClickUp and cache
  if (!CLICKUP_API_TOKEN) {
    return [];
  }

  try {
    const response = await fetch(`${CLICKUP_API_BASE}/task/${ticketId}`, {
      headers: { "Authorization": CLICKUP_API_TOKEN },
    });

    if (!response.ok) {
      console.error(`Failed to fetch task ${ticketId} for attachments:`, response.status);
      return [];
    }

    const task = await response.json();
    const attachments = task.attachments || [];

    if (attachments.length > 0) {
      // Cache attachments in database
      await Promise.all(
        attachments.map(async (att: any) => {
          try {
            await prisma.attachment.upsert({
              where: { id: att.id },
              update: {
                title: att.title || att.filename || "Attachment",
                url: att.url,
                extension: att.extension || null,
                size: att.size || null,
                dateAdded: new Date(parseInt(att.date)),
              },
              create: {
                id: att.id,
                ticketId,
                title: att.title || att.filename || "Attachment",
                url: att.url,
                extension: att.extension || null,
                size: att.size || null,
                dateAdded: new Date(parseInt(att.date)),
              },
            });
          } catch (err) {
            console.error(`Failed to cache attachment ${att.id}:`, err);
          }
        })
      );

      return attachments.map((att: any) => ({
        id: att.id,
        url: att.url,
        title: att.title || att.filename || "Attachment",
      }));
    }

    return [];
  } catch (error) {
    console.error(`Error fetching attachments for task ${ticketId}:`, error);
    return [];
  }
}

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
    const userEmail = session.user.email.toLowerCase();

    // Get ticket from PostgreSQL
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: id,
        userEmail: {
          equals: userEmail,
          mode: "insensitive",
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    // Fetch attachments (from cache or ClickUp)
    const attachments = await getAttachments(ticket.id);

    // Map to API format
    const ticketData = {
      id: ticket.id,
      ticketId: ticket.ticketId,
      name: ticket.name,
      description: ticket.description || "",
      fullDescription: ticket.description || "",
      status: ticket.status,
      priority: ticket.priority || "normal",
      dateCreated: ticket.clickupCreatedAt.getTime().toString(),
      dateUpdated: ticket.clickupUpdatedAt.getTime().toString(),
      businessUnit: ticket.businessUnit,
      app: ticket.app,
      jiraStatus: ticket.jiraStatus,
      jiraAssignee: ticket.jiraAssignee,
      jiraUrl: ticket.jiraUrl,
      attachments,
    };

    return NextResponse.json(ticketData);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching ticket" },
      { status: 500 }
    );
  }
}
