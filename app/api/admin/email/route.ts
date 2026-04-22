import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { searchMessages, isSendGridConfigured, SendGridError } from "@/lib/sendgrid";

// GET /api/admin/email?email=...&days=30
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!isSendGridConfigured()) {
      return NextResponse.json(
        {
          message: "SendGrid is not configured. Set SENDGRID_API_KEY environment variable.",
          configured: false,
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim();
    const daysParam = searchParams.get("days");
    const days = daysParam ? Math.min(parseInt(daysParam, 10) || 30, 90) : 30;

    if (!email) {
      return NextResponse.json(
        { message: "Missing required query parameter: email" },
        { status: 400 }
      );
    }

    const messages = await searchMessages(email, days);

    return NextResponse.json({
      email,
      days,
      total: messages.length,
      messages,
    });
  } catch (error) {
    if (error instanceof SendGridError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 500 }
      );
    }
    console.error("[GET /api/admin/email] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error searching email activity" },
      { status: 500 }
    );
  }
}
