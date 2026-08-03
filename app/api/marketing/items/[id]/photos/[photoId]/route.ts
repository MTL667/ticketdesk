import { NextRequest, NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import { MarketingError } from "@/lib/marketing/items";
import { setPrimaryPhoto } from "@/lib/marketing/photos";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id, photoId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const isPrimary =
      typeof body === "object" &&
      body !== null &&
      "isPrimary" in body &&
      (body as { isPrimary?: unknown }).isPrimary === true;

    if (!isPrimary) {
      return NextResponse.json(
        { message: "Only setting isPrimary: true is supported" },
        { status: 400 }
      );
    }

    const photo = await setPrimaryPhoto(id, photoId);
    return NextResponse.json({ photo });
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error updating photo:", error);
    return NextResponse.json(
      { message: "Failed to update photo" },
      { status: 500 }
    );
  }
}
