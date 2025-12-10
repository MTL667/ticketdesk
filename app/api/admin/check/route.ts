import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

// Check if current user is admin
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({
      isAdmin: isAdmin(session.user.email),
      email: session.user.email,
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false });
  }
}

