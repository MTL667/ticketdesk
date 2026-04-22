import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import {
  getSuppressionStatus,
  removeFromSuppressionList,
  isSendGridConfigured,
  SendGridError,
  SuppressionType,
} from "@/lib/sendgrid";

const VALID_TYPES: SuppressionType[] = ["bounces", "blocks", "invalid_emails", "spam_reports"];

// GET /api/admin/email/suppressions?email=... - check all 4 suppression lists
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
    const email = searchParams.get("email")?.trim();

    if (!email) {
      return NextResponse.json(
        { message: "Missing required query parameter: email" },
        { status: 400 }
      );
    }

    const status = await getSuppressionStatus(email);
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof SendGridError) {
      return NextResponse.json({ message: error.message }, { status: error.status || 500 });
    }
    console.error("[GET /api/admin/email/suppressions] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching suppression status" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email/suppressions?email=...&type=bounces|blocks|invalid_emails|spam_reports
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim();
    const type = searchParams.get("type") as SuppressionType | null;

    if (!email) {
      return NextResponse.json(
        { message: "Missing required query parameter: email" },
        { status: 400 }
      );
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    await removeFromSuppressionList(type, email);

    console.log(`[Admin ${session.user.email}] Removed ${email} from ${type}`);

    return NextResponse.json({
      message: `Removed ${email} from ${type}`,
      email,
      type,
    });
  } catch (error) {
    if (error instanceof SendGridError) {
      return NextResponse.json({ message: error.message }, { status: error.status || 500 });
    }
    console.error("[DELETE /api/admin/email/suppressions] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error removing from suppression list" },
      { status: 500 }
    );
  }
}
