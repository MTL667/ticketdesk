import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

// GET - list all monitored services (admin only)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const services = await prisma.monitoredService.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { message: "Error fetching services" },
      { status: 500 }
    );
  }
}

// POST - create new monitored service (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, zabbixHostId, zabbixHostName, displayOrder } = body;

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    // Get highest display order if not provided
    let order = displayOrder;
    if (order === undefined) {
      const lastService = await prisma.monitoredService.findFirst({
        orderBy: { displayOrder: "desc" },
      });
      order = (lastService?.displayOrder || 0) + 1;
    }

    const service = await prisma.monitoredService.create({
      data: {
        name,
        zabbixHostId: zabbixHostId || null,
        zabbixHostName: zabbixHostName || null,
        displayOrder: order,
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { message: "Error creating service" },
      { status: 500 }
    );
  }
}

