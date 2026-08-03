import { LoanStatus, LoanType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BAKWAGEN_SLUG } from "@/lib/bookavan/bakwagen";
import { parseDateOnlyEndOfDayBrussels } from "@/lib/bookavan/datetime";
import { MarketingError } from "@/lib/marketing/items";
import type {
  CheckoutLoanInput,
  ReturnLoanInput,
} from "@/lib/validators/marketing";

function isOverdue(loan: {
  status: LoanStatus;
  permanent: boolean;
  dueDate: Date | null;
}): boolean {
  if (loan.status === LoanStatus.OVERDUE) return true;
  if (
    loan.status !== LoanStatus.ACTIVE ||
    loan.permanent ||
    !loan.dueDate
  ) {
    return false;
  }
  return loan.dueDate.getTime() < Date.now();
}

export function serializeLoan(loan: {
  id: string;
  type: LoanType;
  status: LoanStatus;
  itemId: string;
  quantity: number;
  borrower: string | null;
  driver: string | null;
  event: string | null;
  reason: string | null;
  destination: string | null;
  dueDate: Date | null;
  startAt: Date | null;
  endAt: Date | null;
  permanent: boolean;
  returnedAt: Date | null;
  createdByEmail: string;
  createdAt: Date;
  item?: { id: string; name: string; slug: string | null } | null;
  entity?: { id: string; name: string } | null;
  company?: string | null;
}) {
  const overdue = loan.type === LoanType.INVENTORY && isOverdue(loan);
  const effectiveStatus =
    overdue && loan.status === LoanStatus.ACTIVE
      ? LoanStatus.OVERDUE
      : loan.status;

  return {
    id: loan.id,
    type: loan.type,
    status: effectiveStatus,
    itemId: loan.itemId,
    itemName: loan.item?.name ?? null,
    itemSlug: loan.item?.slug ?? null,
    quantity: loan.quantity,
    borrower: loan.borrower,
    driver: loan.driver,
    event: loan.event,
    reason: loan.reason,
    destination: loan.destination,
    dueDate: loan.dueDate?.toISOString() ?? null,
    startAt: loan.startAt?.toISOString() ?? null,
    endAt: loan.endAt?.toISOString() ?? null,
    permanent: loan.permanent,
    returnedAt: loan.returnedAt?.toISOString() ?? null,
    createdByEmail: loan.createdByEmail,
    department: loan.entity?.name ?? loan.company ?? null,
    createdAt: loan.createdAt.toISOString(),
    overdue,
  };
}

async function syncOverdueStatuses() {
  await prisma.loan.updateMany({
    where: {
      type: LoanType.INVENTORY,
      status: LoanStatus.ACTIVE,
      permanent: false,
      dueDate: { lt: new Date() },
    },
    data: { status: LoanStatus.OVERDUE },
  });
}

export async function listOpenLoans(options?: {
  itemId?: string;
}) {
  if (options?.itemId) {
    const item = await prisma.item.findUnique({
      where: { id: options.itemId },
      select: { id: true },
    });
    if (!item) {
      throw new MarketingError("Item not found", 404);
    }
  }

  await syncOverdueStatuses();

  const loans = await prisma.loan.findMany({
    where: {
      type: LoanType.INVENTORY,
      status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
      ...(options?.itemId ? { itemId: options.itemId } : {}),
    },
    include: {
      item: { select: { id: true, name: true, slug: true } },
      entity: true,
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return loans.map(serializeLoan);
}

export async function checkoutLoan(
  input: CheckoutLoanInput,
  userEmail: string
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Item" WHERE id = ${input.itemId} FOR UPDATE`;

    const item = await tx.item.findUnique({ where: { id: input.itemId } });
    if (!item) {
      throw new MarketingError("Item not found", 404);
    }

    if (item.slug === BAKWAGEN_SLUG) {
      throw new MarketingError(
        "Reserve the bakwagen via BookAVan, not inventaris checkout",
        409
      );
    }

    if (item.available < input.quantity) {
      throw new MarketingError(
        "Requested quantity exceeds available stock",
        409
      );
    }

    let dueDate: Date | null = null;
    if (!input.permanent && input.dueDate) {
      dueDate = parseDateOnlyEndOfDayBrussels(input.dueDate);
      if (!dueDate) {
        throw new MarketingError("Invalid due date", 400);
      }
    }

    const loan = await tx.loan.create({
      data: {
        type: LoanType.INVENTORY,
        status: LoanStatus.ACTIVE,
        itemId: item.id,
        entityId: item.entityId,
        borrower: input.borrower,
        event: input.event,
        reason: input.event,
        quantity: input.quantity,
        permanent: Boolean(input.permanent),
        dueDate,
        createdByEmail: userEmail,
      },
      include: {
        item: { select: { id: true, name: true, slug: true } },
        entity: true,
      },
    });

    await tx.item.update({
      where: { id: item.id },
      data: { available: item.available - input.quantity },
    });

    return serializeLoan(loan);
  });
}

export async function returnLoan(
  loanId: string,
  input: ReturnLoanInput
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Loan" WHERE id = ${loanId} FOR UPDATE`;

    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: {
        item: { select: { id: true, name: true, slug: true } },
        entity: true,
      },
    });

    if (!loan || loan.type !== LoanType.INVENTORY) {
      throw new MarketingError("Loan not found", 404);
    }

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.OVERDUE
    ) {
      throw new MarketingError("Only open loans can be returned", 400);
    }

    const returnQty = input.quantity ?? loan.quantity;
    if (returnQty > loan.quantity) {
      throw new MarketingError(
        "Return quantity exceeds loan quantity",
        400
      );
    }

    await tx.$queryRaw`SELECT id FROM "Item" WHERE id = ${loan.itemId} FOR UPDATE`;
    const item = await tx.item.findUnique({ where: { id: loan.itemId } });
    if (!item) {
      throw new MarketingError("Item not found", 404);
    }

    const now = new Date();
    let updated;

    if (returnQty === loan.quantity) {
      updated = await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: LoanStatus.RETURNED,
          returnedAt: now,
          quantity: loan.quantity,
        },
        include: {
          item: { select: { id: true, name: true, slug: true } },
          entity: true,
        },
      });
    } else {
      updated = await tx.loan.update({
        where: { id: loan.id },
        data: {
          quantity: loan.quantity - returnQty,
        },
        include: {
          item: { select: { id: true, name: true, slug: true } },
          entity: true,
        },
      });
    }

    await tx.item.update({
      where: { id: item.id },
      data: { available: item.available + returnQty },
    });

    return serializeLoan(updated);
  });
}
