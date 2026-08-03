import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, isMarketing } from "@/lib/admin";
import {
  BookAVanError,
  cancelReservation,
} from "@/lib/bookavan/reservations";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const canForceCancel =
      isMarketing(session.user.email) || isAdmin(session.user.email);

    const reservation = await cancelReservation(
      id,
      session.user.email,
      canForceCancel
    );

    return NextResponse.json({ reservation });
  } catch (error) {
    if (error instanceof BookAVanError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { message: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}
