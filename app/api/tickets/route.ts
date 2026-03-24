import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getLastSyncStatus, syncTicketsFromClickUp, isSyncRunning } from "@/lib/sync";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase();

    // Get tickets from PostgreSQL (filtered by user email)
    const tickets = await prisma.ticket.findMany({
      where: {
        userEmail: {
          equals: userEmail,
          mode: "insensitive",
        },
      },
      orderBy: {
        clickupCreatedAt: "desc",
      },
    });

    // Get total count for metadata
    const totalTickets = await prisma.ticket.count();

    // Get last sync info
    const lastSync = await getLastSyncStatus();
    
    // Auto-sync only once per hour (sync takes ~16 minutes for large lists)
    const ONE_HOUR = 60 * 60 * 1000;
    const shouldAutoSync = !lastSync || 
      (lastSync.status === "completed" && lastSync.completedAt && 
       new Date().getTime() - lastSync.completedAt.getTime() > ONE_HOUR);

    if (shouldAutoSync && !(await isSyncRunning())) {
      console.log("Auto-sync triggered (data older than 1 hour)");
      // Trigger background sync (don't await)
      syncTicketsFromClickUp().catch(console.error);
    }

    // Map to API format
    const ticketsData = tickets.map((ticket) => ({
      id: ticket.id,
      ticketId: ticket.ticketId,
      name: ticket.name,
      description: ticket.description || "",
      status: ticket.status,
      priority: ticket.priority,
      dateCreated: ticket.clickupCreatedAt.getTime().toString(),
      dateUpdated: ticket.clickupUpdatedAt.getTime().toString(),
      businessUnit: ticket.businessUnit,
      jiraStatus: ticket.jiraStatus,
      jiraAssignee: ticket.jiraAssignee,
      jiraUrl: ticket.jiraUrl,
    }));

    return NextResponse.json({
      tickets: ticketsData,
      metadata: {
        totalTasksSearched: totalTickets,
        userTicketsFound: tickets.length,
        listCount: process.env.CLICKUP_LIST_IDS?.split(",").length || 1,
        lastSyncAt: lastSync?.completedAt?.toISOString(),
        syncStatus: lastSync?.status,
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching tickets" },
      { status: 500 }
    );
  }
}
