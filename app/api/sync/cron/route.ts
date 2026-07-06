import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { syncTicketsFromClickUp, isSyncRunning } from "@/lib/sync";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not configured");
      return NextResponse.json(
        { message: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const tokenValid = token != null &&
      token.length === cronSecret.length &&
      timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret));

    if (!tokenValid) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (await isSyncRunning()) {
      return NextResponse.json(
        { message: "Sync already in progress", status: "running" },
        { status: 409 }
      );
    }

    console.log("Cron sync triggered by Cronicle");
    syncTicketsFromClickUp()
      .then((result) => {
        console.log("Cron sync completed:", result);
      })
      .catch((error) => {
        console.error("Cron sync failed:", error);
      });

    return NextResponse.json({ status: "started" });
  } catch (error) {
    console.error("Error in cron sync endpoint:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
