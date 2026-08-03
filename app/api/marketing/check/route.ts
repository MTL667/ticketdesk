import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isMarketing } from "@/lib/admin";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      isMarketing: isMarketing(session.user.email),
      email: session.user.email,
    });
  } catch (error) {
    console.error("Error checking marketing status:", error);
    return NextResponse.json(
      { message: "Failed to check marketing status" },
      { status: 500 }
    );
  }
}
