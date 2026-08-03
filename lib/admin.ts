// Admin / marketing authorization utilities

const ADMIN_EMAILS = process.env.ADMIN_EMAILS || "";
const MARKETING_USERS = process.env.MARKETING_USERS || "";

function parseEmailList(value: string): string[] {
  return value
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseEmailList(ADMIN_EMAILS).includes(email.toLowerCase());
}

export function getAdminEmails(): string[] {
  return parseEmailList(ADMIN_EMAILS);
}

export function isMarketing(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseEmailList(MARKETING_USERS).includes(email.toLowerCase());
}

export function getMarketingEmails(): string[] {
  return parseEmailList(MARKETING_USERS);
}


