import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isMarketing } from "@/lib/admin";

export type MarketingSession = {
  email: string;
};

export async function requireMarketing(): Promise<
  { session: MarketingSession } | { error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isMarketing(session.user.email)) {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { session: { email: session.user.email } };
}
