import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncTicketsFromClickUp, getLastSyncStatus, isSyncRunning, resetStuckSyncs } from "@/lib/sync";

// POST: Trigger a sync
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check for force parameter
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Reset stuck syncs if force is true
    if (force) {
      console.log("Force sync requested, resetting stuck syncs...");
      await resetStuckSyncs();
    }

    // Check if sync is already running
    if (await isSyncRunning()) {
      console.log("Sync already running, returning 409");
      return NextResponse.json(
        { message: "Sync is already in progress", status: "running" },
        { status: 409 }
      );
    }

    console.log("Starting new sync...");
    
    // Start sync (don't await - let it run in background)
    syncTicketsFromClickUp()
      .then(result => {
        console.log("Sync completed:", result);
      })
      .catch(error => {
        console.error("Sync failed:", error);
      });

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

// DELETE: Reset stuck syncs
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const count = await resetStuckSyncs();
    console.log(`Reset ${count} stuck syncs`);

    return NextResponse.json({
      message: `Reset ${count} stuck sync(s)`,
      count,
    });
  } catch (error) {
    console.error("Error resetting syncs:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error resetting syncs" },
      { status: 500 }
    );
  }
}
