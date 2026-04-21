import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

// Escape a single CSV field per RFC 4180
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString();
}

// GET /api/admin/users/[email]/export - Download CSV export of a user's tickets
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
    });

    const header = [
      "Ticket ID",
      "ClickUp ID",
      "Name",
      "Status",
      "Priority",
      "App",
      "Business Unit",
      "Jira Status",
      "Jira Assignee",
      "Jira URL",
      "Created",
      "Last Updated",
      "Due Date",
      "User Email",
    ];

    const rows = tickets.map((t) =>
      toCsvRow([
        t.ticketId,
        t.id,
        t.name,
        t.status,
        t.priority,
        t.app,
        t.businessUnit,
        t.jiraStatus,
        t.jiraAssignee,
        t.jiraUrl,
        formatDate(t.clickupCreatedAt),
        formatDate(t.clickupUpdatedAt),
        formatDate(t.dueDate),
        t.userEmail,
      ])
    );

    // BOM so Excel opens UTF-8 correctly
    const csv = "\uFEFF" + [toCsvRow(header), ...rows].join("\r\n");

    const safeEmail = decodedEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `tickets_${safeEmail}_${dateStr}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/users/[email]/export] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error exporting tickets" },
      { status: 500 }
    );
  }
}
