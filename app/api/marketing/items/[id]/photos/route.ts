import { NextRequest, NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import { MarketingError } from "@/lib/marketing/items";
import {
  listPhotos,
  PhotoBatchError,
  uploadPhotos,
} from "@/lib/marketing/photos";
import { StorageError } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const photos = await listPhotos(id);
    return NextResponse.json({ photos });
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error listing photos:", error);
    return NextResponse.json(
      { message: "Failed to list photos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { message: "Invalid multipart form data" },
        { status: 400 }
      );
    }

    const entries = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ].filter((entry): entry is File => entry instanceof File);

    const result = await uploadPhotos(id, entries);
    const status = result.errors.length > 0 ? 207 : 201;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof PhotoBatchError) {
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: error.status }
      );
    }
    if (error instanceof MarketingError || error instanceof StorageError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error uploading photos:", error);
    return NextResponse.json(
      { message: "Failed to upload photos" },
      { status: 500 }
    );
  }
}
