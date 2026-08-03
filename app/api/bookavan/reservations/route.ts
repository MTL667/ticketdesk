import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  BookAVanError,
  createReservation,
  listReservations,
} from "@/lib/bookavan/reservations";
import { notifyMarketingOfPendingReservation } from "@/lib/bookavan/notify";
import { createReservationSchema } from "@/lib/validators/bookavan";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const reservations = await listReservations();
    return NextResponse.json({ reservations });
  } catch (error) {
    if (error instanceof BookAVanError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error listing reservations:", error);
    return NextResponse.json(
      { message: "Failed to list reservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createReservationSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "Invalid reservation payload";
      return NextResponse.json({ message }, { status: 400 });
    }

    const reservation = await createReservation(
      parsed.data,
      session.user.email
    );
    void notifyMarketingOfPendingReservation(reservation);
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof BookAVanError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { message: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
