import { LoanStatus, LoanType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getBakwagenItem } from "@/lib/bookavan/bakwagen";
import {
  BookAVanError,
  serializeReservation,
} from "@/lib/bookavan/reservations";

export async function listPendingReservations() {
  const bakwagen = await getBakwagenItem();
  if (!bakwagen) {
    throw new BookAVanError("Bakwagen item is not configured", 500);
  }

  const loans = await prisma.loan.findMany({
    where: {
      itemId: bakwagen.id,
      type: LoanType.RESERVATION,
      status: LoanStatus.PENDING,
    },
    include: { entity: true },
    orderBy: [{ startAt: "asc" }, { createdAt: "asc" }],
  });

  return loans.map(serializeReservation);
}

export async function approveReservation(
  loanId: string,
  reviewerEmail: string
) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { entity: true },
  });

  if (!loan || loan.type !== LoanType.RESERVATION) {
    throw new BookAVanError("Reservation not found", 404);
  }
  if (loan.status !== LoanStatus.PENDING) {
    throw new BookAVanError("Only pending reservations can be approved", 400);
  }

  const updated = await prisma.loan.update({
    where: { id: loan.id },
    data: {
      status: LoanStatus.ACTIVE,
      reviewedAt: new Date(),
      reviewedByEmail: reviewerEmail,
      rejectionReason: null,
    },
    include: { entity: true },
  });

  return serializeReservation(updated);
}

export async function rejectReservation(
  loanId: string,
  reviewerEmail: string,
  reason: string
) {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new BookAVanError("Rejection reason is required", 400);
  }

  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { entity: true },
  });

  if (!loan || loan.type !== LoanType.RESERVATION) {
    throw new BookAVanError("Reservation not found", 404);
  }
  if (loan.status !== LoanStatus.PENDING) {
    throw new BookAVanError("Only pending reservations can be rejected", 400);
  }

  const updated = await prisma.loan.update({
    where: { id: loan.id },
    data: {
      status: LoanStatus.REJECTED,
      rejectionReason: trimmed,
      reviewedAt: new Date(),
      reviewedByEmail: reviewerEmail,
    },
    include: { entity: true },
  });

  return serializeReservation(updated);
}
