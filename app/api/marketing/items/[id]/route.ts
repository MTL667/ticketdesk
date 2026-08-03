import { NextRequest, NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import {
  deleteItem,
  getItem,
  MarketingError,
  updateItem,
} from "@/lib/marketing/items";
import { itemUpdateSchema } from "@/lib/validators/marketing";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const result = await getItem(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error fetching marketing item:", error);
    return NextResponse.json(
      { message: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const parsed = itemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid item payload" },
        { status: 400 }
      );
    }

    const item = await updateItem(id, parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error updating marketing item:", error);
    return NextResponse.json(
      { message: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const result = await deleteItem(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error deleting marketing item:", error);
    return NextResponse.json(
      { message: "Failed to delete item" },
      { status: 500 }
    );
  }
}
