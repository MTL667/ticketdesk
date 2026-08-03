import { NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import prisma from "@/lib/prisma";
import { getObject, StorageError } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string; photoId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id: itemId, photoId } = await context.params;

    const photo = await prisma.itemPhoto.findFirst({
      where: { id: photoId, itemId },
      select: { key: true },
    });

    if (!photo?.key?.trim()) {
      return NextResponse.json({ message: "Photo not found" }, { status: 404 });
    }

    const object = await getObject(photo.key);

    return new NextResponse(new Uint8Array(object.body), {
      status: 200,
      headers: {
        "Content-Type": object.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(object.body.length),
      },
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error streaming marketing photo:", error);
    return NextResponse.json(
      { message: "Failed to load photo" },
      { status: 500 }
    );
  }
}
