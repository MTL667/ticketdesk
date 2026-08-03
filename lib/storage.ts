import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const S3_TIMEOUT_MS = 30_000;
const MAX_GET_BYTES = 10 * 1024 * 1024;
const MARKETING_PHOTO_KEY_PREFIX = "marketing/items/";

export class StorageError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "StorageError";
    this.status = status;
  }
}

type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new StorageError(`Missing required env: ${name}`, 500);
  }
  return value;
}

export function getStorageConfig(): StorageConfig {
  return {
    endpoint: requireEnv("S3_ENDPOINT"),
    region: process.env.S3_REGION?.trim() || "auto",
    bucket: requireEnv("S3_BUCKET"),
    accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    publicUrl: (process.env.S3_PUBLIC_URL?.trim() || "").replace(/\/$/, ""),
  };
}

function configFingerprint(config: StorageConfig): string {
  return [
    config.endpoint,
    config.region,
    config.bucket,
    config.accessKeyId,
    config.secretAccessKey,
  ].join("|");
}

let cached: { fingerprint: string; client: S3Client } | null = null;

function getClient(): { client: S3Client; config: StorageConfig } {
  const config = getStorageConfig();
  const fingerprint = configFingerprint(config);
  if (!cached || cached.fingerprint !== fingerprint) {
    cached = {
      fingerprint,
      client: new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: true,
      }),
    };
  }
  return { client: cached.client, config };
}

export function publicUrlForKey(key: string): string {
  const { publicUrl } = getStorageConfig();
  const normalized = key.replace(/^\//, "");
  // Legacy bookkeeping column; gallery display uses authenticated proxy URLs.
  if (!publicUrl) return `s3://${normalized}`;
  return `${publicUrl}/${normalized}`;
}

export async function uploadObject(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ key: string; url: string }> {
  const { client: s3, config } = getClient();
  const key = params.key.replace(/^\//, "");

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: params.body,
        ContentType: params.contentType,
      }),
      { abortSignal: AbortSignal.timeout(S3_TIMEOUT_MS) }
    );
  } catch (error) {
    console.error("S3 upload failed:", error);
    throw new StorageError("Failed to upload object to storage", 502);
  }

  return { key, url: publicUrlForKey(key) };
}

export async function deleteObject(key: string): Promise<void> {
  const { client: s3, config } = getClient();
  const normalized = key.replace(/^\//, "");

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: normalized,
      }),
      { abortSignal: AbortSignal.timeout(S3_TIMEOUT_MS) }
    );
  } catch (error) {
    console.error("S3 delete failed:", error);
    throw new StorageError("Failed to delete object from storage", 502);
  }
}

export async function getObject(key: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  const { client: s3, config } = getClient();
  const normalized = key.replace(/^\//, "").trim();

  if (!normalized || !normalized.startsWith(MARKETING_PHOTO_KEY_PREFIX)) {
    throw new StorageError("Object not found in storage", 404);
  }

  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: normalized,
      }),
      { abortSignal: AbortSignal.timeout(S3_TIMEOUT_MS) }
    );

    if (!response.Body) {
      throw new StorageError("Empty object body from storage", 502);
    }

    if (
      typeof response.ContentLength === "number" &&
      response.ContentLength > MAX_GET_BYTES
    ) {
      throw new StorageError("Object too large to fetch", 502);
    }

    const bytes = Buffer.from(await response.Body.transformToByteArray());
    if (bytes.length > MAX_GET_BYTES) {
      throw new StorageError("Object too large to fetch", 502);
    }

    return {
      body: bytes,
      contentType: response.ContentType || "application/octet-stream",
    };
  } catch (error) {
    if (error instanceof StorageError) throw error;
    const name =
      error && typeof error === "object" && "name" in error
        ? String((error as { name: unknown }).name)
        : "";
    const statusCode =
      error && typeof error === "object" && "$metadata" in error
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode
        : undefined;
    if (
      name === "NoSuchKey" ||
      name === "NotFound" ||
      statusCode === 404
    ) {
      throw new StorageError("Object not found in storage", 404);
    }
    console.error("S3 get failed:", error);
    throw new StorageError("Failed to fetch object from storage", 502);
  }
}
