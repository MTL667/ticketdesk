import { NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import { listPendingReservations } from "@/lib/bookavan/approvals";
import { BookAVanError } from "@/lib/bookavan/reservations";

export async function GET() {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const reservations = await listPendingReservations();
    return NextResponse.json({ reservations });
  } catch (error) {
    if (error instanceof BookAVanError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error listing pending BookAVan reservations:", error);
    return NextResponse.json(
      { message: "Failed to list pending reservations" },
      { status: 500 }
    );
  }
}
