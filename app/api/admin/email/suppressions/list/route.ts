import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import {
  listSuppressions,
  isSendGridConfigured,
  SendGridError,
  SuppressionType,
} from "@/lib/sendgrid";

const VALID_TYPES: SuppressionType[] = ["bounces", "blocks", "invalid_emails", "spam_reports"];

// GET /api/admin/email/suppressions/list?type=bounces&limit=500&offset=0
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
        { message: "SendGrid is not configured.", configured: false },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as SuppressionType | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "500", 10) || 500, 500);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const entries = await listSuppressions(type, limit, offset);

    return NextResponse.json({
      type,
      limit,
      offset,
      count: entries.length,
      entries,
    });
  } catch (error) {
    if (error instanceof SendGridError) {
      return NextResponse.json({ message: error.message }, { status: error.status || 500 });
    }
    console.error("[GET /api/admin/email/suppressions/list] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error listing suppressions" },
      { status: 500 }
    );
  }
}
