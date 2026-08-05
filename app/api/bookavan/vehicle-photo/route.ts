import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBakwagenItem } from "@/lib/bookavan/bakwagen";
import prisma from "@/lib/prisma";
import { getObject, StorageError } from "@/lib/storage";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return jsonError("Unauthorized", 401);
    }

    const bakwagen = await getBakwagenItem();
    if (!bakwagen) {
      return jsonError("Bakwagen item is not configured", 404);
    }

    const photo = await prisma.itemPhoto.findFirst({
      where: { itemId: bakwagen.id },
      orderBy: [
        { isPrimary: "desc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      select: { key: true },
    });

    if (!photo?.key?.trim()) {
      return jsonError("Photo not found", 404);
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
      return jsonError(error.message, error.status);
    }
    console.error("Error streaming BookAVan vehicle photo:", error);
    return jsonError("Failed to load vehicle photo", 500);
  }
}
