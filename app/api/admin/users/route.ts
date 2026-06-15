import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

// GET /api/admin/users - List all users with ticket count and status breakdown.
// Optional ?search= to filter by email (partial, case-insensitive).
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const statusParam = searchParams.get("status")?.trim() || "";

    const where: Record<string, unknown> = {};
    if (search) where.userEmail = { contains: search, mode: "insensitive" };
    if (statusParam) where.status = { equals: statusParam, mode: "insensitive" };

    const grouped = await prisma.ticket.groupBy({
      by: ["userEmail", "status"],
      _count: { _all: true },
      where: Object.keys(where).length > 0 ? where : undefined,
    });

    const userMap = new Map<
      string,
      { email: string; total: number; statuses: Record<string, number> }
    >();

    for (const row of grouped) {
      const key = row.userEmail;
      if (!userMap.has(key)) {
        userMap.set(key, { email: key, total: 0, statuses: {} });
      }
      const entry = userMap.get(key)!;
      entry.total += row._count._all;
      entry.statuses[row.status] = (entry.statuses[row.status] || 0) + row._count._all;
    }

    const users = Array.from(userMap.values()).sort((a, b) => b.total - a.total);

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error("[GET /api/admin/users] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching users" },
      { status: 500 }
    );
  }
}
