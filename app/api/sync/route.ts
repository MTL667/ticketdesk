import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncTicketsFromClickUp, getLastSyncStatus, isSyncRunning } from "@/lib/sync";

// POST: Trigger a sync
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if sync is already running
    if (await isSyncRunning()) {
      return NextResponse.json(
        { message: "Sync is already in progress", status: "running" },
        { status: 409 }
      );
    }

    // Start sync (don't await - let it run in background)
    syncTicketsFromClickUp().catch(console.error);

    return NextResponse.json({
      message: "Sync started",
      status: "started",
    });
  } catch (error) {
    console.error("Error starting sync:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error starting sync" },
      { status: 500 }
    );
  }
}

// GET: Get sync status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const lastSync = await getLastSyncStatus();
    const isRunning = await isSyncRunning();

    return NextResponse.json({
      lastSync,
      isRunning,
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error getting sync status" },
      { status: 500 }
    );
  }
}

