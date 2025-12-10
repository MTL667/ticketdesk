import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all tickets with releaseNotes = true (no email filter)
    const releases = await prisma.ticket.findMany({
      where: {
        releaseNotes: true,
      },
      orderBy: {
        dueDate: "desc", // Sort by due date, newest first
      },
    });

    // Map to API format
    const releasesData = releases.map((ticket) => ({
      id: ticket.id,
      ticketId: ticket.ticketId,
      name: ticket.name,
      description: ticket.description || "",
      status: ticket.status,
      priority: ticket.priority,
      dueDate: ticket.dueDate?.getTime().toString() || null,
      dateCreated: ticket.clickupCreatedAt.getTime().toString(),
      dateUpdated: ticket.clickupUpdatedAt.getTime().toString(),
      businessUnit: ticket.businessUnit,
      app: ticket.app,
      jiraStatus: ticket.jiraStatus,
      jiraAssignee: ticket.jiraAssignee,
      jiraUrl: ticket.jiraUrl,
    }));

    return NextResponse.json({
      releases: releasesData,
      metadata: {
        totalReleases: releases.length,
      },
    });
  } catch (error) {
    console.error("Error fetching releases:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching releases" },
      { status: 500 }
    );
  }
}



