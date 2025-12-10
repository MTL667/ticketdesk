import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

const BANNER_KEY = "homepage_banner";

// GET - fetch banner (public for authenticated users)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const setting = await prisma.setting.findUnique({
      where: { key: BANNER_KEY },
    });

    return NextResponse.json({
      banner: setting?.value || null,
      updatedAt: setting?.updatedAt || null,
      updatedBy: setting?.updatedBy || null,
    });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      { message: "Error fetching banner" },
      { status: 500 }
    );
  }
}

// POST - update banner (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { message } = body;

    // Upsert the banner setting
    const setting = await prisma.setting.upsert({
      where: { key: BANNER_KEY },
      update: {
        value: message || null,
        updatedBy: session.user.email,
      },
      create: {
        key: BANNER_KEY,
        value: message || null,
        updatedBy: session.user.email,
      },
    });

    return NextResponse.json({
      success: true,
      banner: setting.value,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { message: "Error updating banner" },
      { status: 500 }
    );
  }
}

// DELETE - clear banner (admin only)
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ message: "Forbidden - Admin only" }, { status: 403 });
    }

    await prisma.setting.upsert({
      where: { key: BANNER_KEY },
      update: {
        value: null,
        updatedBy: session.user.email,
      },
      create: {
        key: BANNER_KEY,
        value: null,
        updatedBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing banner:", error);
    return NextResponse.json(
      { message: "Error clearing banner" },
      { status: 500 }
    );
  }
}

