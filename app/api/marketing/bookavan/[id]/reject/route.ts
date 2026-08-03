import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMarketing } from "@/lib/marketing/auth";
import { rejectReservation } from "@/lib/bookavan/approvals";
import { notifyRequesterOfRejection } from "@/lib/bookavan/notify";
import { BookAVanError } from "@/lib/bookavan/reservations";

type RouteContext = { params: Promise<{ id: string }> };

const rejectSchema = z.object({
  reason: z.string().trim().min(1, "Rejection reason is required"),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "Invalid rejection payload";
      return NextResponse.json({ message }, { status: 400 });
    }

    const { id } = await context.params;
    const reservation = await rejectReservation(
      id,
      authResult.session.email,
      parsed.data.reason
    );
    void notifyRequesterOfRejection(reservation);

    return NextResponse.json({ reservation });
  } catch (error) {
    if (error instanceof BookAVanError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error rejecting BookAVan reservation:", error);
    return NextResponse.json(
      { message: "Failed to reject reservation" },
      { status: 500 }
    );
  }
}
