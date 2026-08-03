import { LoanStatus, LoanType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getBakwagenItem } from "@/lib/bookavan/bakwagen";
import { parseBookingDateTime } from "@/lib/bookavan/datetime";
import {
  findOverlappingReservation,
  lockItemForUpdate,
} from "@/lib/bookavan/overlap";
import type { CreateReservationInput } from "@/lib/validators/bookavan";

export class BookAVanError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BookAVanError";
    this.status = status;
  }
}

export function serializeReservation(loan: {
  id: string;
  status: LoanStatus;
  driver: string | null;
  company: string | null;
  destination: string | null;
  reason: string | null;
  notes: string | null;
  startAt: Date | null;
  endAt: Date | null;
  claimAcceptedAt: Date | null;
  claimAcceptedBy: string | null;
  createdByEmail: string;
  rejectionReason?: string | null;
  reviewedAt?: Date | null;
  reviewedByEmail?: string | null;
  createdAt: Date;
  entityId: string | null;
  entity?: { id: string; name: string } | null;
}) {
  return {
    id: loan.id,
    status: loan.status,
    driver: loan.driver,
    department: loan.entity?.name ?? loan.company,
    entityId: loan.entityId,
    destination: loan.destination,
    reason: loan.reason,
    notes: loan.notes,
    startAt: loan.startAt?.toISOString() ?? null,
    endAt: loan.endAt?.toISOString() ?? null,
    claimAcceptedAt: loan.claimAcceptedAt?.toISOString() ?? null,
    claimAcceptedBy: loan.claimAcceptedBy,
    createdByEmail: loan.createdByEmail,
    rejectionReason: loan.rejectionReason ?? null,
    reviewedAt: loan.reviewedAt?.toISOString() ?? null,
    reviewedByEmail: loan.reviewedByEmail ?? null,
    createdAt: loan.createdAt.toISOString(),
  };
}

function serializeConflict(loan: {
  id: string;
  startAt: Date | null;
  endAt: Date | null;
}) {
  return {
    id: loan.id,
    startAt: loan.startAt?.toISOString() ?? null,
    endAt: loan.endAt?.toISOString() ?? null,
  };
}

function serializeStatusSnippet(loan: {
  driver: string | null;
  startAt: Date | null;
  endAt: Date | null;
}) {
  return {
    driver: loan.driver,
    startAt: loan.startAt?.toISOString() ?? null,
    endAt: loan.endAt?.toISOString() ?? null,
  };
}

const BLOCKING_STATUSES: LoanStatus[] = [
  LoanStatus.PENDING,
  LoanStatus.ACTIVE,
];

export async function listReservations() {
  const bakwagen = await getBakwagenItem();
  if (!bakwagen) {
    throw new BookAVanError("Bakwagen item is not configured", 500);
  }

  const loans = await prisma.loan.findMany({
    where: {
      itemId: bakwagen.id,
      type: LoanType.RESERVATION,
    },
    include: { entity: true },
    orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
  });

  return loans.map(serializeReservation);
}

export async function createReservation(
  input: CreateReservationInput,
  userEmail: string
) {
  const bakwagen = await getBakwagenItem();
  if (!bakwagen) {
    throw new BookAVanError("Bakwagen item is not configured", 500);
  }

  const entity = await prisma.entity.findUnique({
    where: { id: input.entityId },
  });
  if (!entity) {
    throw new BookAVanError("Department not found", 400);
  }

  const startAt = parseBookingDateTime(input.startAt);
  const endAt = parseBookingDateTime(input.endAt);
  if (!startAt || !endAt) {
    throw new BookAVanError("Invalid start or end date", 400);
  }

  const now = new Date();

  const loan = await prisma.$transaction(async (tx) => {
    await lockItemForUpdate(tx, bakwagen.id);

    const overlapping = await findOverlappingReservation(
      tx,
      bakwagen.id,
      startAt,
      endAt
    );
    if (overlapping) {
      throw new BookAVanError(
        "This period overlaps an existing reservation",
        409
      );
    }

    return tx.loan.create({
      data: {
        type: LoanType.RESERVATION,
        status: LoanStatus.PENDING,
        itemId: bakwagen.id,
        entityId: entity.id,
        driver: input.driver,
        company: entity.name,
        destination: input.destination,
        reason: input.reason,
        notes: input.notes || null,
        startAt,
        endAt,
        claimAcceptedAt: now,
        claimAcceptedBy: userEmail,
        createdByEmail: userEmail,
        quantity: 1,
        permanent: false,
      },
      include: { entity: true },
    });
  });

  return serializeReservation(loan);
}

export async function getAvailability(from: Date, to: Date) {
  const bakwagen = await getBakwagenItem();
  if (!bakwagen) {
    throw new BookAVanError("Bakwagen item is not configured", 500);
  }

  const now = new Date();

  const overlapping = await prisma.loan.findMany({
    where: {
      itemId: bakwagen.id,
      type: LoanType.RESERVATION,
      status: { in: BLOCKING_STATUSES },
      AND: [
        { endAt: { gt: now } },
        { startAt: { lt: to } },
        { endAt: { gt: from } },
      ],
    },
    select: { id: true, startAt: true, endAt: true },
    orderBy: { startAt: "asc" },
  });

  const activeNow = await prisma.loan.findFirst({
    where: {
      itemId: bakwagen.id,
      type: LoanType.RESERVATION,
      status: { in: BLOCKING_STATUSES },
      startAt: { lte: now },
      endAt: { gt: now },
    },
    select: { driver: true, startAt: true, endAt: true },
    orderBy: { startAt: "asc" },
  });

  const nextUpcoming = await prisma.loan.findFirst({
    where: {
      itemId: bakwagen.id,
      type: LoanType.RESERVATION,
      status: { in: BLOCKING_STATUSES },
      startAt: { gt: now },
      endAt: { gt: now },
    },
    select: { driver: true, startAt: true, endAt: true },
    orderBy: { startAt: "asc" },
  });

  return {
    available: overlapping.length === 0,
    vehicleStatus: activeNow ? "reserved" : "available",
    activeReservation: activeNow ? serializeStatusSnippet(activeNow) : null,
    nextReservation: nextUpcoming
      ? serializeStatusSnippet(nextUpcoming)
      : null,
    conflicts: overlapping.map(serializeConflict),
  };
}

export async function cancelReservation(
  loanId: string,
  userEmail: string,
  canForceCancel: boolean
) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { entity: true },
  });

  if (!loan || loan.type !== LoanType.RESERVATION) {
    throw new BookAVanError("Reservation not found", 404);
  }

  if (loan.status === LoanStatus.CANCELLED) {
    throw new BookAVanError("Reservation is already cancelled", 400);
  }

  if (
    loan.status !== LoanStatus.ACTIVE &&
    loan.status !== LoanStatus.PENDING
  ) {
    throw new BookAVanError(
      "Only pending or active reservations can be cancelled",
      400
    );
  }

  const isOwner =
    loan.createdByEmail.toLowerCase() === userEmail.toLowerCase();
  if (!isOwner && !canForceCancel) {
    throw new BookAVanError(
      "You are not allowed to cancel this reservation",
      409
    );
  }

  const now = new Date();
  const hasStarted = Boolean(
    loan.startAt && loan.startAt.getTime() <= now.getTime()
  );
  if (hasStarted && !canForceCancel) {
    throw new BookAVanError(
      "Started reservations can only be cancelled by marketing or admin",
      409
    );
  }

  const result = await prisma.loan.updateMany({
    where: {
      id: loan.id,
      status: { in: [LoanStatus.ACTIVE, LoanStatus.PENDING] },
    },
    data: { status: LoanStatus.CANCELLED },
  });

  if (result.count === 0) {
    throw new BookAVanError("Reservation is already cancelled", 400);
  }

  const updated = await prisma.loan.findUnique({
    where: { id: loan.id },
    include: { entity: true },
  });

  if (!updated) {
    throw new BookAVanError("Reservation not found", 404);
  }

  return serializeReservation(updated);
}
