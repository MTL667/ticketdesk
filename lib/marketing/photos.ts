import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { MarketingError } from "@/lib/marketing/items";
import { deleteObject, StorageError, uploadObject } from "@/lib/storage";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 20;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;

export class PhotoBatchError extends Error {
  status: number;
  errors: { file: string; message: string }[];

  constructor(
    message: string,
    status: number,
    errors: { file: string; message: string }[]
  ) {
    super(message);
    this.name = "PhotoBatchError";
    this.status = status;
    this.errors = errors;
  }
}

export function serializePhoto(photo: {
  id: string;
  itemId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}) {
  return {
    id: photo.id,
    itemId: photo.itemId,
    url: photo.url,
    isPrimary: photo.isPrimary,
    sortOrder: photo.sortOrder,
    createdAt: photo.createdAt.toISOString(),
  };
}

export async function listPhotos(itemId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true },
  });
  if (!item) {
    throw new MarketingError("Item not found", 404);
  }

  const photos = await prisma.itemPhoto.findMany({
    where: { itemId },
    orderBy: [
      { isPrimary: "desc" },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return photos.map(serializePhoto);
}

function extensionFor(file: File): string | null {
  const fromType = ALLOWED_TYPES[file.type.toLowerCase()];
  if (fromType) return fromType;
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".gif")) return "gif";
  return null;
}

async function uploadOne(
  itemId: string,
  file: File,
  sortOrder: number,
  makePrimary: boolean
) {
  const ext = extensionFor(file);
  if (!ext) {
    throw new MarketingError(
      `Unsupported file type for ${file.name || "file"}`,
      400
    );
  }
  if (file.size <= 0) {
    throw new MarketingError("Empty file", 400);
  }
  if (file.size > MAX_BYTES) {
    throw new MarketingError(
      `File too large (max ${MAX_BYTES / (1024 * 1024)}MB)`,
      400
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `marketing/items/${itemId}/${randomUUID()}.${ext}`;
  const contentType =
    Object.entries(ALLOWED_TYPES).find(([, e]) => e === ext)?.[0] ||
    file.type ||
    "application/octet-stream";

  const uploaded = await uploadObject({
    key,
    body: bytes,
    contentType,
  });

  try {
    const photo = await prisma.itemPhoto.create({
      data: {
        itemId,
        url: uploaded.url,
        key: uploaded.key,
        isPrimary: makePrimary,
        sortOrder,
      },
    });
    return serializePhoto(photo);
  } catch (error) {
    await deleteObject(uploaded.key).catch(() => undefined);
    throw error;
  }
}

export async function uploadPhotos(itemId: string, files: File[]) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true },
  });
  if (!item) {
    throw new MarketingError("Item not found", 404);
  }

  if (files.length === 0) {
    throw new MarketingError("At least one file is required", 400);
  }
  if (files.length > MAX_FILES) {
    throw new MarketingError(`Too many files (max ${MAX_FILES})`, 413);
  }
  const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new MarketingError(
      `Total upload too large (max ${MAX_TOTAL_BYTES / (1024 * 1024)}MB)`,
      413
    );
  }

  const [maxOrder, existingPrimary] = await Promise.all([
    prisma.itemPhoto.aggregate({
      where: { itemId },
      _max: { sortOrder: true },
    }),
    prisma.itemPhoto.findFirst({
      where: { itemId, isPrimary: true },
      select: { id: true },
    }),
  ]);
  const hasPrimary = Boolean(existingPrimary);

  const photos = [];
  const errors: { file: string; message: string }[] = [];
  const failureKinds: Array<"storage" | "other"> = [];
  let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;
  let primaryAssigned = hasPrimary;

  for (const file of files) {
    const label = file.name || "file";
    try {
      const makePrimary = !primaryAssigned;
      const photo = await uploadOne(itemId, file, nextOrder, makePrimary);
      photos.push(photo);
      nextOrder += 1;
      if (makePrimary) primaryAssigned = true;
    } catch (error) {
      if (error instanceof StorageError) {
        failureKinds.push("storage");
        errors.push({ file: label, message: error.message });
      } else if (error instanceof MarketingError) {
        failureKinds.push("other");
        errors.push({ file: label, message: error.message });
      } else {
        failureKinds.push("other");
        console.error("Photo upload error:", error);
        errors.push({ file: label, message: "Failed to upload photo" });
      }
    }
  }

  if (photos.length === 0) {
    const allStorage =
      failureKinds.length > 0 && failureKinds.every((k) => k === "storage");
    throw new PhotoBatchError(
      errors[0]?.message || "Failed to upload photos",
      allStorage ? 502 : 400,
      errors
    );
  }

  // Repair accidental multi-primary from concurrent uploads
  const primaries = await prisma.itemPhoto.findMany({
    where: { itemId, isPrimary: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (primaries.length > 1) {
    const keepId = primaries[0].id;
    await prisma.itemPhoto.updateMany({
      where: { itemId, isPrimary: true, NOT: { id: keepId } },
      data: { isPrimary: false },
    });
  }

  const refreshed = await listPhotos(itemId);
  const uploadedIds = new Set(photos.map((p) => p.id));
  return {
    photos: refreshed.filter((p) => uploadedIds.has(p.id)),
    errors,
  };
}

export async function setPrimaryPhoto(itemId: string, photoId: string) {
  return prisma.$transaction(async (tx) => {
    const photo = await tx.itemPhoto.findFirst({
      where: { id: photoId, itemId },
    });
    if (!photo) {
      throw new MarketingError("Photo not found", 404);
    }

    await tx.itemPhoto.updateMany({
      where: { itemId, isPrimary: true },
      data: { isPrimary: false },
    });

    const updated = await tx.itemPhoto.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });

    return serializePhoto(updated);
  });
}
