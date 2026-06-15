import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

type View = "month" | "quarter" | "year";

interface DateRange {
  gte: Date;
  lt: Date;
}

function parsePeriod(view: View, period: string): DateRange | null {
  if (view === "month") {
    const match = period.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    const year = parseInt(match[1]);
    const monthNum = parseInt(match[2]);
    if (monthNum < 1 || monthNum > 12) return null;
    const month = monthNum - 1;
    return {
      gte: new Date(year, month, 1),
      lt: new Date(year, month + 1, 1),
    };
  }

  if (view === "quarter") {
    const match = period.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return null;
    const year = parseInt(match[1]);
    const q = parseInt(match[2]);
    return {
      gte: new Date(year, (q - 1) * 3, 1),
      lt: new Date(year, q * 3, 1),
    };
  }

  if (view === "year") {
    const match = period.match(/^(\d{4})$/);
    if (!match) return null;
    const year = parseInt(match[1]);
    return {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    };
  }

  return null;
}

function getTrendRanges(view: View, period: string): { label: string; range: DateRange }[] {
  const ranges: { label: string; range: DateRange }[] = [];

  if (view === "month") {
    const match = period.match(/^(\d{4})-(\d{2})$/);
    if (!match) return ranges;
    const endYear = parseInt(match[1]);
    const endMonth = parseInt(match[2]) - 1;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(endYear, endMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = `${y}-${String(m + 1).padStart(2, "0")}`;
      ranges.push({ label, range: { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) } });
    }
  }

  if (view === "quarter") {
    const match = period.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return ranges;
    const year = parseInt(match[1]);
    for (let q = 1; q <= 4; q++) {
      ranges.push({
        label: `Q${q}`,
        range: { gte: new Date(year, (q - 1) * 3, 1), lt: new Date(year, q * 3, 1) },
      });
    }
  }

  if (view === "year") {
    const match = period.match(/^(\d{4})$/);
    if (!match) return ranges;
    const year = parseInt(match[1]);
    for (let q = 1; q <= 4; q++) {
      ranges.push({
        label: `Q${q}`,
        range: { gte: new Date(year, (q - 1) * 3, 1), lt: new Date(year, q * 3, 1) },
      });
    }
  }

  return ranges;
}

async function getStatusCounts(range: DateRange) {
  const grouped = await prisma.ticket.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: { clickupCreatedAt: { gte: range.gte, lt: range.lt } },
  });

  const statuses: Record<string, number> = {};
  let total = 0;
  for (const row of grouped) {
    statuses[row.status] = row._count._all;
    total += row._count._all;
  }
  return { total, statuses };
}

async function getTopCreators(range: DateRange, limit = 10) {
  const grouped = await prisma.ticket.groupBy({
    by: ["userEmail"],
    _count: { _all: true },
    where: { clickupCreatedAt: { gte: range.gte, lt: range.lt } },
  });

  return grouped
    .map((row) => ({
      email: row.userEmail,
      name: row.userEmail.split("@")[0],
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

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
    const view = (searchParams.get("view") || "month") as View;
    const periodParam = searchParams.get("period");

    if (!["month", "quarter", "year"].includes(view)) {
      return NextResponse.json({ message: "Invalid view parameter" }, { status: 400 });
    }

    const now = new Date();
    const defaultPeriod =
      view === "month"
        ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        : view === "quarter"
          ? `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`
          : `${now.getFullYear()}`;

    const period = periodParam || defaultPeriod;
    const range = parsePeriod(view, period);

    if (!range) {
      return NextResponse.json({ message: "Invalid period format" }, { status: 400 });
    }

    const [current, topCreators] = await Promise.all([
      getStatusCounts(range),
      getTopCreators(range),
    ]);

    const trendRanges = getTrendRanges(view, period);
    const trend = await Promise.all(
      trendRanges.map(async ({ label, range: r }) => {
        const counts = await getStatusCounts(r);
        return { label, ...counts };
      })
    );

    return NextResponse.json({ current, trend, topCreators });
  } catch (error) {
    console.error("[GET /api/admin/stats] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error fetching stats" },
      { status: 500 }
    );
  }
}
