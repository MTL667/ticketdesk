import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const S3_TIMEOUT_MS = 30_000;

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
    publicUrl: requireEnv("S3_PUBLIC_URL").replace(/\/$/, ""),
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
