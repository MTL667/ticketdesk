import { LoanStatus, LoanType, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BAKWAGEN_SLUG } from "@/lib/bookavan/bakwagen";
import type { ItemCreateInput, ItemUpdateInput } from "@/lib/validators/marketing";

const LIST_LIMIT = 200;
const LOAN_HISTORY_LIMIT = 50;

export class MarketingError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MarketingError";
    this.status = status;
  }
}

export function serializeItem(item: {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  location: string | null;
  total: number;
  available: number;
  minStock: number;
  notes: string | null;
  entityId: string | null;
  createdAt: Date;
  updatedAt: Date;
  entity?: { id: string; name: string } | null;
}) {
  const needsReorder = item.available <= item.minStock;
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    category: item.category,
    location: item.location,
    total: item.total,
    available: item.available,
    minStock: item.minStock,
    notes: item.notes,
    entityId: item.entityId,
    entityName: item.entity?.name ?? null,
    loaned: Math.max(0, item.total - item.available),
    needsReorder,
    isBakwagen: item.slug === BAKWAGEN_SLUG,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type ListItemsQuery = {
  entityId?: string;
  category?: string;
  q?: string;
};

async function openInventoryLoanQuantity(itemId: string): Promise<number> {
  const openLoans = await prisma.loan.findMany({
    where: {
      itemId,
      type: LoanType.INVENTORY,
      status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
    },
    select: { quantity: true },
  });
  return openLoans.reduce((sum, loan) => sum + loan.quantity, 0);
}

function assertStockMatchesLoans(
  total: number,
  available: number,
  openLoanQty: number
) {
  if (total < openLoanQty) {
    throw new MarketingError(
      "Total cannot be less than open loan quantity",
      409
    );
  }
  const maxAvailable = total - openLoanQty;
  if (available > maxAvailable) {
    throw new MarketingError(
      `Available cannot exceed ${maxAvailable} while loans are open`,
      409
    );
  }
}

export async function listItems(query: ListItemsQuery = {}) {
  const where: Prisma.ItemWhereInput = {};

  if (query.entityId) {
    where.entityId = query.entityId;
  }
  if (query.category) {
    where.category = query.category;
  }
  if (query.q?.trim()) {
    const q = query.q.trim().slice(0, 100);
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, allCategories, entities] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { entity: true },
      orderBy: [{ name: "asc" }],
      take: LIST_LIMIT,
    }),
    prisma.item.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
    prisma.entity.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serialized = items.map(serializeItem);

  const totalUnits = serialized.reduce((sum, i) => sum + i.total, 0);
  const availableUnits = serialized.reduce((sum, i) => sum + i.available, 0);
  const loanedUnits = serialized.reduce((sum, i) => sum + i.loaned, 0);
  const reorderNeeded = serialized.filter((i) => i.needsReorder).length;

  const categories = allCategories
    .map((row) => row.category)
    .filter((value): value is string => Boolean(value));

  return {
    items: serialized,
    kpis: {
      totalUnits,
      availableUnits,
      loanedUnits,
      reorderNeeded,
    },
    filters: {
      categories,
      entities,
    },
    meta: {
      limit: LIST_LIMIT,
      truncated: items.length === LIST_LIMIT,
    },
  };
}

export async function getItem(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: { entity: true },
  });
  if (!item) {
    throw new MarketingError("Item not found", 404);
  }

  const [loans, loanCount, photos] = await Promise.all([
    prisma.loan.findMany({
      where: { itemId: id },
      include: { entity: true },
      orderBy: [{ createdAt: "desc" }],
      take: LOAN_HISTORY_LIMIT,
    }),
    prisma.loan.count({ where: { itemId: id } }),
    prisma.itemPhoto.findMany({
      where: { itemId: id },
      orderBy: [
        { isPrimary: "desc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    }),
  ]);

  return {
    item: serializeItem(item),
    loans: loans.map((loan) => ({
      id: loan.id,
      type: loan.type,
      status: loan.status,
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
      department: loan.entity?.name ?? loan.company,
      createdAt: loan.createdAt.toISOString(),
    })),
    loansMeta: {
      limit: LOAN_HISTORY_LIMIT,
      total: loanCount,
      truncated: loanCount > LOAN_HISTORY_LIMIT,
    },
    photos: photos.map((photo) => ({
      id: photo.id,
      itemId: photo.itemId,
      url: photo.url,
      isPrimary: photo.isPrimary,
      sortOrder: photo.sortOrder,
      createdAt: photo.createdAt.toISOString(),
    })),
  };
}

export async function createItem(input: ItemCreateInput) {
  const entity = await prisma.entity.findUnique({
    where: { id: input.entityId },
  });
  if (!entity) {
    throw new MarketingError("Entity not found", 400);
  }

  const item = await prisma.item.create({
    data: {
      name: input.name,
      entityId: entity.id,
      category: input.category,
      location: input.location || null,
      total: input.total,
      available: input.available,
      minStock: input.minStock,
      notes: input.notes || null,
    },
    include: { entity: true },
  });

  return serializeItem(item);
}

export async function updateItem(id: string, input: ItemUpdateInput) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Item" WHERE id = ${id} FOR UPDATE`;

    const existing = await tx.item.findUnique({ where: { id } });
    if (!existing) {
      throw new MarketingError("Item not found", 404);
    }

    const entity = await tx.entity.findUnique({
      where: { id: input.entityId },
    });
    if (!entity) {
      throw new MarketingError("Entity not found", 400);
    }

    const openLoans = await tx.loan.findMany({
      where: {
        itemId: id,
        type: LoanType.INVENTORY,
        status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
      },
      select: { quantity: true },
    });
    const openLoanQty = openLoans.reduce((sum, loan) => sum + loan.quantity, 0);
    assertStockMatchesLoans(input.total, input.available, openLoanQty);

    const item = await tx.item.update({
      where: { id },
      data: {
        name: input.name,
        entityId: entity.id,
        category: input.category,
        location: input.location || null,
        total: input.total,
        available: input.available,
        minStock: input.minStock,
        notes: input.notes || null,
      },
      include: { entity: true },
    });

    return serializeItem(item);
  });
}

export async function deleteItem(id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.item.findUnique({ where: { id } });
    if (!existing) {
      throw new MarketingError("Item not found", 404);
    }

    if (existing.slug === BAKWAGEN_SLUG) {
      throw new MarketingError("The bakwagen item cannot be deleted", 409);
    }

    const loanCount = await tx.loan.count({ where: { itemId: id } });
    if (loanCount > 0) {
      throw new MarketingError(
        "Cannot delete an item with loan or reservation history",
        409
      );
    }

    await tx.item.delete({ where: { id } });
    return { id };
  });
}
