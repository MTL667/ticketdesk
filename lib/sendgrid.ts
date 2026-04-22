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
