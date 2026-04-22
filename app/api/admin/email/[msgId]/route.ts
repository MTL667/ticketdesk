import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getMessageDetail, isSendGridConfigured, SendGridError } from "@/lib/sendgrid";

// GET /api/admin/email/[msgId] - full message detail with event trace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ msgId: string }> }
) {
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
        { message: "SendGrid is not configured." },
        { status: 503 }
      );
    }

    const { msgId } = await params;
    const detail = await getMessageDetail(msgId);

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof SendGridError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 500 }
      );
    }
    console.error("[GET /api/admin/email/[msgId]] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching message detail" },
      { status: 500 }
    );
  }
}
