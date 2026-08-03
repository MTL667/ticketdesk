import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseBookingDateTime } from "@/lib/bookavan/datetime";
import { BookAVanError, getAvailability } from "@/lib/bookavan/reservations";
import { availabilityQuerySchema } from "@/lib/validators/bookavan";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = availabilityQuerySchema.safeParse({
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
    });

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "Invalid availability query";
      return NextResponse.json({ message }, { status: 400 });
    }

    const from = parseBookingDateTime(parsed.data.from);
    const to = parseBookingDateTime(parsed.data.to);
    if (!from || !to) {
      return NextResponse.json(
        { message: "Invalid from or to date" },
        { status: 400 }
      );
    }

    const availability = await getAvailability(from, to);
    return NextResponse.json(availability);
  } catch (error) {
    if (error instanceof BookAVanError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { message: "Failed to check availability" },
      { status: 500 }
    );
  }
}
