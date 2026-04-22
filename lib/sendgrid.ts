// SendGrid Email Activity API wrapper
// Docs: https://www.twilio.com/docs/sendgrid/api-reference/e-mail-activity
// Note: Requires the "Email Activity" add-on to be enabled on the SendGrid account.

const SENDGRID_API_BASE = "https://api.sendgrid.com/v3";

export interface SendGridMessageSummary {
  msg_id: string;
  from_email: string;
  subject: string;
  to_email: string;
  status: string; // "processed" | "delivered" | "not_delivered"
  opens_count?: number;
  clicks_count?: number;
  last_event_time: string; // ISO 8601
}

export interface SendGridEvent {
  event_name: string; // "processed" | "delivered" | "open" | "click" | "bounce" | "dropped" | "deferred" | "spam_report" | "unsubscribe"
  processed: string; // ISO 8601
  reason?: string;
  attempt_num?: number;
  url?: string;
  ip?: string;
  mx_server?: string;
  bounce_classification?: string;
  http_user_agent?: string;
}

export interface SendGridMessageDetail {
  msg_id: string;
  from_email: string;
  subject: string;
  to_email: string;
  status: string;
  opens_count?: number;
  clicks_count?: number;
  last_event_time: string;
  events?: SendGridEvent[];
  api_key_id?: string;
  asm_group_id?: number;
  categories?: string[];
  unique_args?: string;
  outbound_ip?: string;
  outbound_ip_type?: string;
  teammate?: string;
  template_id?: string;
}

export class SendGridError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "SendGridError";
  }
}

function getApiKey(): string {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    throw new SendGridError("SENDGRID_API_KEY is not configured");
  }
  return key;
}

// Search messages via Email Activity Feed.
// `email` is used to match both to_email and from_email within the last `days` days.
export async function searchMessages(
  email: string,
  days = 30,
  limit = 100
): Promise<SendGridMessageSummary[]> {
  const apiKey = getApiKey();

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const fromIso = from.toISOString();
  const toIso = now.toISOString();

  // Build SendGrid query language string
  // Reference: https://www.twilio.com/docs/sendgrid/api-reference/e-mail-activity/filter-all-messages
  const safeEmail = email.replace(/"/g, '\\"');
  const queryStr = `(to_email="${safeEmail}" OR from_email="${safeEmail}") AND last_event_time BETWEEN TIMESTAMP "${fromIso}" AND TIMESTAMP "${toIso}"`;

  const params = new URLSearchParams({
    query: queryStr,
    limit: String(limit),
  });

  const response = await fetch(`${SENDGRID_API_BASE}/messages?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new SendGridError(
      `SendGrid API error: ${response.status} - ${text}`,
      response.status
    );
  }

  const data = await response.json();
  return (data.messages || []) as SendGridMessageSummary[];
}

// Get full detail + events (trace) for a single message
export async function getMessageDetail(msgId: string): Promise<SendGridMessageDetail> {
  const apiKey = getApiKey();

  const response = await fetch(`${SENDGRID_API_BASE}/messages/${encodeURIComponent(msgId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new SendGridError(
      `SendGrid API error: ${response.status} - ${text}`,
      response.status
    );
  }

  return (await response.json()) as SendGridMessageDetail;
}

export function isSendGridConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}

// ----- Suppression lists -----
// Docs:
//   https://www.twilio.com/docs/sendgrid/api-reference/bounces-api
//   https://www.twilio.com/docs/sendgrid/api-reference/blocks-api
//   https://www.twilio.com/docs/sendgrid/api-reference/invalid-e-mails-api
//   https://www.twilio.com/docs/sendgrid/api-reference/spam-reports-api

export type SuppressionType = "bounces" | "blocks" | "invalid_emails" | "spam_reports";

export interface SuppressionEntry {
  email: string;
  created: number; // unix seconds
  reason?: string;
  status?: string;
}

async function getSuppressionForList(
  type: SuppressionType,
  email: string
): Promise<SuppressionEntry | null> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${SENDGRID_API_BASE}/suppression/${type}/${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new SendGridError(
      `SendGrid API error (${type}): ${response.status} - ${text}`,
      response.status
    );
  }

  const data = await response.json();

  // API returns either an array of entries or empty array when not found
  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    return data[0] as SuppressionEntry;
  }

  if (data && typeof data === "object" && data.email) {
    return data as SuppressionEntry;
  }

  return null;
}

export interface SuppressionStatus {
  email: string;
  bounces: SuppressionEntry | null;
  blocks: SuppressionEntry | null;
  invalid_emails: SuppressionEntry | null;
  spam_reports: SuppressionEntry | null;
}

export async function getSuppressionStatus(email: string): Promise<SuppressionStatus> {
  const [bounces, blocks, invalid, spam] = await Promise.all([
    getSuppressionForList("bounces", email).catch(() => null),
    getSuppressionForList("blocks", email).catch(() => null),
    getSuppressionForList("invalid_emails", email).catch(() => null),
    getSuppressionForList("spam_reports", email).catch(() => null),
  ]);

  return {
    email,
    bounces,
    blocks,
    invalid_emails: invalid,
    spam_reports: spam,
  };
}

// List all entries of a suppression list with pagination
export async function listSuppressions(
  type: SuppressionType,
  limit = 500,
  offset = 0
): Promise<SuppressionEntry[]> {
  const apiKey = getApiKey();

  const params = new URLSearchParams({
    limit: String(Math.min(limit, 500)),
    offset: String(offset),
  });

  const response = await fetch(
    `${SENDGRID_API_BASE}/suppression/${type}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new SendGridError(
      `SendGrid API error listing ${type}: ${response.status} - ${text}`,
      response.status
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as SuppressionEntry[]) : [];
}

export async function removeFromSuppressionList(
  type: SuppressionType,
  email: string
): Promise<void> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${SENDGRID_API_BASE}/suppression/${type}/${encodeURIComponent(email)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw new SendGridError(
      `SendGrid API error removing from ${type}: ${response.status} - ${text}`,
      response.status
    );
  }
}
