import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTaskComments, postTaskComment, getTask, filterTasksByEmail } from "@/lib/clickup";

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

    // Verify the ticket belongs to the user
    const task = await getTask(id);
    const userTasks = filterTasksByEmail([task], session.user.email);
    
    if (userTasks.length === 0) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    // Get comments
    const comments = await getTaskComments(id);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error(`[GET /api/tickets/${(await params).id}/comments] Error:`, error);
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

    // Verify the ticket belongs to the user
    const task = await getTask(id);
    const userTasks = filterTasksByEmail([task], session.user.email);
    
    if (userTasks.length === 0) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    // Post the comment
    const newComment = await postTaskComment(id, comment.trim());

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error(`[POST /api/tickets/${(await params).id}/comments] Error:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error posting comment" },
      { status: 500 }
    );
  }
}

