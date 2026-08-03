import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const entities = await prisma.entity.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return NextResponse.json({ entities });
  } catch (error) {
    console.error("Error listing entities:", error);
    return NextResponse.json(
      { message: "Failed to list entities" },
      { status: 500 }
    );
  }
}
