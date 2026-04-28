import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  parseJiraKeyFromUrl,
  getIssueComments,
  postIssueComment,
  getCommentProperty,
  isOwnComment,
  uploadAttachment,
  JiraError,
  type JiraComment,
} from "@/lib/jira";

async function classifyComments(comments: JiraComment[]) {
  const own: JiraComment[] = [];
  const received: JiraComment[] = [];

  for (const comment of comments) {
    const prop = await getCommentProperty(comment.id, "source").catch(() => null);
    const hasProperty = prop === "ticketdesk";

    if (isOwnComment(comment, hasProperty)) {
      own.push({ ...comment, isOwnComment: true });
    } else {
      received.push({ ...comment, isOwnComment: false });
    }
  }

  return { own, received };
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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userEmail: { equals: session.user.email, mode: "insensitive" },
      },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    if (!ticket.jiraUrl) {
      return NextResponse.json({ message: "Ticket has no Jira link" }, { status: 400 });
    }

    const issueKey = parseJiraKeyFromUrl(ticket.jiraUrl);
    if (!issueKey) {
      return NextResponse.json({ message: "Could not parse Jira key from URL" }, { status: 400 });
    }

    const comments = await getIssueComments(issueKey);
    const { own, received } = await classifyComments(comments);

    const all = [...own, ...received].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    );

    return NextResponse.json({ comments: all, issueKey });
  } catch (error) {
    const { id } = await params;
    console.error(`[GET /api/tickets/${id}/jira-comments] Error:`, error);
    return NextResponse.json(
      { message: error instanceof JiraError ? error.message : "Error fetching Jira comments" },
      { status: error instanceof JiraError ? (error.status || 500) : 500 }
    );
  }
}

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

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userEmail: { equals: session.user.email, mode: "insensitive" },
      },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    if (!ticket.jiraUrl) {
      return NextResponse.json({ message: "Ticket has no Jira link" }, { status: 400 });
    }

    const issueKey = parseJiraKeyFromUrl(ticket.jiraUrl);
    if (!issueKey) {
      return NextResponse.json({ message: "Could not parse Jira key from URL" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const comment = formData.get("comment") as string;
      const file = formData.get("file") as File | null;

      if (!comment || comment.trim().length === 0) {
        return NextResponse.json({ message: "Comment text is required" }, { status: 400 });
      }

      let attachmentRef = "";
      if (file) {
        const attachment = await uploadAttachment(issueKey, file);
        attachmentRef = `\n[Attachment: ${attachment.filename}]`;
      }

      const authorName = session.user.email.split("@")[0] || session.user.email;
      const newComment = await postIssueComment(issueKey, comment.trim() + attachmentRef, authorName);
      return NextResponse.json({ comment: newComment }, { status: 201 });
    }

    const body = await request.json();
    const { comment } = body;

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return NextResponse.json({ message: "Comment text is required" }, { status: 400 });
    }

    const authorName = session.user.email.split("@")[0] || session.user.email;
    const newComment = await postIssueComment(issueKey, comment.trim(), authorName);

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    const { id } = await params;
    console.error(`[POST /api/tickets/${id}/jira-comments] Error:`, error);
    return NextResponse.json(
      { message: error instanceof JiraError ? error.message : "Error posting Jira comment" },
      { status: error instanceof JiraError ? (error.status || 500) : 500 }
    );
  }
}
