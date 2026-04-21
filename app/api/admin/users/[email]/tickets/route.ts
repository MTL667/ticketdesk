import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

// GET /api/admin/users/[email]/tickets - List all tickets for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    const tickets = await prisma.ticket.findMany({
      where: {
        userEmail: { equals: decodedEmail, mode: "insensitive" },
      },
      orderBy: { clickupCreatedAt: "desc" },
      select: {
        id: true,
        ticketId: true,
        name: true,
        status: true,
        priority: true,
        app: true,
        businessUnit: true,
        jiraStatus: true,
        jiraAssignee: true,
        jiraUrl: true,
        clickupCreatedAt: true,
        clickupUpdatedAt: true,
        dueDate: true,
      },
    });

    // Build status breakdown
    const statuses: Record<string, number> = {};
    for (const t of tickets) {
      statuses[t.status] = (statuses[t.status] || 0) + 1;
    }

    return NextResponse.json({
      email: decodedEmail,
      total: tickets.length,
      statuses,
      tickets,
    });
  } catch (error) {
    console.error("[GET /api/admin/users/[email]/tickets] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching tickets" },
      { status: 500 }
    );
  }
}
