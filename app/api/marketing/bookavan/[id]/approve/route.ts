import { NextRequest, NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import { approveReservation } from "@/lib/bookavan/approvals";
import { notifyRequesterOfApproval } from "@/lib/bookavan/notify";
import { BookAVanError } from "@/lib/bookavan/reservations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id } = await context.params;
    const reservation = await approveReservation(id, authResult.session.email);
    void notifyRequesterOfApproval(reservation);

    return NextResponse.json({ reservation });
  } catch (error) {
    if (error instanceof BookAVanError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error approving BookAVan reservation:", error);
    return NextResponse.json(
      { message: "Failed to approve reservation" },
      { status: 500 }
    );
  }
}
