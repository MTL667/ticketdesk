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

    // Get release by ID (must have releaseNotes = true)
    const release = await prisma.ticket.findFirst({
      where: {
        id: id,
        releaseNotes: true,
      },
    });

    if (!release) {
      return NextResponse.json({ message: "Release not found" }, { status: 404 });
    }

    // Map to API format
    const releaseData = {
      id: release.id,
      ticketId: release.ticketId,
      name: release.name,
      description: release.description || "",
      fullDescription: release.description || "",
      status: release.status,
      priority: release.priority || "normal",
      dueDate: release.dueDate?.getTime().toString() || null,
      dateCreated: release.clickupCreatedAt.getTime().toString(),
      dateUpdated: release.clickupUpdatedAt.getTime().toString(),
      businessUnit: release.businessUnit,
      app: release.app,
      jiraStatus: release.jiraStatus,
      jiraAssignee: release.jiraAssignee,
      jiraUrl: release.jiraUrl,
    };

    return NextResponse.json(releaseData);
  } catch (error) {
    console.error("Error fetching release:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching release" },
      { status: 500 }
    );
  }
}



