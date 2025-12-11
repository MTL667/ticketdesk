// Admin utilities

const ADMIN_EMAILS = process.env.ADMIN_EMAILS || "";

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminList = ADMIN_EMAILS
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);
  
  return adminList.includes(email.toLowerCase());
}

export function getAdminEmails(): string[] {
  return ADMIN_EMAILS
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);
}


