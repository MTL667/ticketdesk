import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
      jiraStatus: ticket.jiraStatus,
      jiraAssignee: ticket.jiraAssignee,
      jiraUrl: ticket.jiraUrl,
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
