import { NextRequest, NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import { createItem, listItems, MarketingError } from "@/lib/marketing/items";
import { itemCreateSchema } from "@/lib/validators/marketing";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { searchParams } = new URL(request.url);
    const result = await listItems({
      entityId: searchParams.get("entityId") || undefined,
      category: searchParams.get("category") || undefined,
      q: searchParams.get("q") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error listing marketing items:", error);
    return NextResponse.json(
      { message: "Failed to list items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const parsed = itemCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid item payload" },
        { status: 400 }
      );
    }

    const item = await createItem(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error creating marketing item:", error);
    return NextResponse.json(
      { message: "Failed to create item" },
      { status: 500 }
    );
  }
}
