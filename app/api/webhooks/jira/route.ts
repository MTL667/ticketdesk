import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJiraKeyFromUrl } from "@/lib/jira";
import { sendCommentNotification } from "@/lib/sendgrid";
import { extractPlainText } from "@/lib/adf-utils";

const DEDUP_TTL_MS = 5 * 60 * 1000;
const processedEvents = new Map<string, number>();

function cleanupProcessedEvents() {
  const now = Date.now();
  for (const [key, timestamp] of processedEvents) {
    if (now - timestamp > DEDUP_TTL_MS) {
      processedEvents.delete(key);
    }
  }
}

function isDuplicate(commentId: string, updated: string): boolean {
  cleanupProcessedEvents();
  const key = `${commentId}:${updated}`;
  if (processedEvents.has(key)) return true;
  processedEvents.set(key, Date.now());
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const secretParam = request.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.JIRA_WEBHOOK_SECRET;
    if (expectedSecret && secretParam !== expectedSecret) {
      console.warn("[jira-webhook] Invalid or missing secret");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const payload = await request.json();

    const webhookEvent = payload.webhookEvent || payload.issue_event_type_name || "";
    if (!webhookEvent.includes("comment_created") && webhookEvent !== "comment_created") {
      return NextResponse.json({ ok: true, skipped: "not a comment event" }, { status: 200 });
    }

    const comment = payload.comment;
    if (!comment || !comment.id) {
      return NextResponse.json({ ok: true, skipped: "no comment in payload" }, { status: 200 });
    }

    if (isDuplicate(String(comment.id), comment.updated || comment.created || "")) {
      return NextResponse.json({ ok: true, skipped: "duplicate" }, { status: 200 });
    }

    const serviceEmail = (process.env.JIRA_EMAIL || "").toLowerCase();
    const authorEmail = (comment.author?.emailAddress || "").toLowerCase();
    const authorAccountId = comment.author?.accountId || "";
    const jiraAccountId = process.env.JIRA_ACCOUNT_ID || "";

    if (serviceEmail && authorEmail && authorEmail === serviceEmail) {
      return NextResponse.json({ ok: true, skipped: "own comment (email match)" }, { status: 200 });
    }

    if (jiraAccountId && authorAccountId && authorAccountId === jiraAccountId) {
      return NextResponse.json({ ok: true, skipped: "own comment (accountId match)" }, { status: 200 });
    }

    const commentBody = comment.body;
    if (commentBody) {
      const firstText = commentBody?.content?.[0]?.content?.[0]?.text || "";
      if (firstText.startsWith("[") && firstText.includes("]: ")) {
        return NextResponse.json({ ok: true, skipped: "own comment (prefix pattern)" }, { status: 200 });
      }
    }

    const issueKey = payload.issue?.key;
    if (!issueKey) {
      return NextResponse.json({ ok: true, skipped: "no issue key" }, { status: 200 });
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        jiraUrl: { contains: issueKey },
      },
      select: {
        id: true,
        name: true,
        ticketId: true,
        userEmail: true,
      },
    });

    if (!ticket || !ticket.userEmail) {
      return NextResponse.json({ ok: true, skipped: "ticket not found" }, { status: 200 });
    }

    const preview = commentBody
      ? extractPlainText(commentBody).slice(0, 200)
      : "New comment on your ticket";

    const authorName = comment.author?.displayName || "Developer";

    try {
      await sendCommentNotification(
        ticket.userEmail,
        ticket.name,
        ticket.id,
        `${authorName}: ${preview}`
      );
    } catch (err) {
      console.error("[jira-webhook] SendGrid notification failed:", err);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[jira-webhook] Error processing webhook:", error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
