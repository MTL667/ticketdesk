import { NextRequest, NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import { MarketingError } from "@/lib/marketing/items";
import { checkoutLoan, listOpenLoans } from "@/lib/marketing/loans";
import { checkoutLoanSchema } from "@/lib/validators/marketing";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId") || undefined;
    const loans = await listOpenLoans({ itemId });
    return NextResponse.json({ loans });
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error listing loans:", error);
    return NextResponse.json(
      { message: "Failed to list loans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const parsed = checkoutLoanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message || "Invalid checkout payload",
        },
        { status: 400 }
      );
    }

    const loan = await checkoutLoan(parsed.data, authResult.session.email);
    return NextResponse.json({ loan }, { status: 201 });
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error checking out loan:", error);
    return NextResponse.json(
      { message: "Failed to checkout loan" },
      { status: 500 }
    );
  }
}
