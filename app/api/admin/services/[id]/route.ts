import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

// GET - get single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const service = await prisma.monitoredService.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { message: "Error fetching service" },
      { status: 500 }
    );
  }
}

// PUT - update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      zabbixHostId,
      zabbixHostName,
      manualStatus,
      manualMessage,
      displayOrder,
      isActive,
    } = body;

    const service = await prisma.monitoredService.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(zabbixHostId !== undefined && { zabbixHostId }),
        ...(zabbixHostName !== undefined && { zabbixHostName }),
        ...(manualStatus !== undefined && { manualStatus }),
        ...(manualMessage !== undefined && { manualMessage }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { message: "Error updating service" },
      { status: 500 }
    );
  }
}

// DELETE - delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.monitoredService.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { message: "Error deleting service" },
      { status: 500 }
    );
  }
}


