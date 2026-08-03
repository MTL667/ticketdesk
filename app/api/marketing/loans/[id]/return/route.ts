import { NextRequest, NextResponse } from "next/server";
import { requireMarketing } from "@/lib/marketing/auth";
import { MarketingError } from "@/lib/marketing/items";
import { returnLoan } from "@/lib/marketing/loans";
import { returnLoanSchema } from "@/lib/validators/marketing";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireMarketing();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;

    let body: unknown = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const parsed = returnLoanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message || "Invalid return payload",
        },
        { status: 400 }
      );
    }

    const loan = await returnLoan(id, parsed.data);
    return NextResponse.json({ loan });
  } catch (error) {
    if (error instanceof MarketingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("Error returning loan:", error);
    return NextResponse.json(
      { message: "Failed to return loan" },
      { status: 500 }
    );
  }
}
