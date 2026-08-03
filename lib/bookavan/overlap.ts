import { LoanStatus, LoanType, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && endA > startB;
}

/** Active, non-cancelled reservations that have not already ended. */
export function blockingReservationWhere(
  itemId: string,
  startAt: Date,
  endAt: Date,
  excludeLoanId?: string,
  now: Date = new Date()
): Prisma.LoanWhereInput {
  return {
    itemId,
    type: LoanType.RESERVATION,
    status: { not: LoanStatus.CANCELLED },
    AND: [
      { endAt: { gt: now } },
      { startAt: { lt: endAt } },
      { endAt: { gt: startAt } },
    ],
    ...(excludeLoanId ? { id: { not: excludeLoanId } } : {}),
  };
}

export async function hasReservationOverlap(
  itemId: string,
  startAt: Date,
  endAt: Date,
  excludeLoanId?: string
): Promise<boolean> {
  const overlapping = await prisma.loan.findFirst({
    where: blockingReservationWhere(itemId, startAt, endAt, excludeLoanId),
    select: { id: true },
  });
  return overlapping !== null;
}

type TxClient = Prisma.TransactionClient;

export async function lockItemForUpdate(tx: TxClient, itemId: string) {
  await tx.$queryRaw`SELECT id FROM "Item" WHERE id = ${itemId} FOR UPDATE`;
}

export async function findOverlappingReservation(
  tx: TxClient,
  itemId: string,
  startAt: Date,
  endAt: Date,
  excludeLoanId?: string
) {
  return tx.loan.findFirst({
    where: blockingReservationWhere(itemId, startAt, endAt, excludeLoanId),
  });
}
