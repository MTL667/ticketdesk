import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTaskComments, postTaskComment, getTask, filterTasksByEmail, ClickUpNotFoundError } from "@/lib/clickup";
import prisma from "@/lib/prisma";

// GET /api/tickets/[id]/comments - Get all comments for a ticket
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

    // Verify ticket exists in local DB and belongs to user
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userEmail: { equals: session.user.email, mode: "insensitive" },
      },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    const comments = await getTaskComments(id);

    return NextResponse.json({ comments });
  } catch (error) {
    const { id } = await params;
    if (error instanceof ClickUpNotFoundError) {
      return NextResponse.json(
        { message: "This ticket has been removed from ClickUp. Messages are no longer available.", deleted: true },
        { status: 404 }
      );
    }
    console.error(`[GET /api/tickets/${id}/comments] Error:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching comments" },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/comments - Add a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { comment } = body;

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return NextResponse.json(
        { message: "Comment text is required" },
        { status: 400 }
      );
    }

    // Verify ticket exists in local DB and belongs to user
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userEmail: { equals: session.user.email, mode: "insensitive" },
      },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    const newComment = await postTaskComment(id, comment.trim());

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    const { id } = await params;
    if (error instanceof ClickUpNotFoundError) {
      return NextResponse.json(
        { message: "This ticket has been removed from ClickUp. Sending messages is no longer possible.", deleted: true },
        { status: 404 }
      );
    }
    console.error(`[POST /api/tickets/${id}/comments] Error:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error posting comment" },
      { status: 500 }
    );
  }
}

