import { z } from "zod";
import {
  parseDateOnlyEndOfDayBrussels,
  startOfTodayBrussels,
} from "@/lib/bookavan/datetime";

const nonNegInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return Number.NaN;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return Number.NaN;
    return Number(trimmed);
  }
  return value;
}, z.number().int().finite().min(0, "Must be ≥ 0"));

export const itemCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    entityId: z.string().trim().min(1, "Entity is required"),
    category: z.string().trim().min(1, "Category is required"),
    location: z.string().trim().optional().nullable(),
    total: nonNegInt,
    available: nonNegInt,
    minStock: nonNegInt,
    notes: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.available > data.total) {
      ctx.addIssue({
        code: "custom",
        message: "Available cannot exceed total",
        path: ["available"],
      });
    }
  });

export const itemUpdateSchema = itemCreateSchema;

const positiveInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return Number.NaN;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return Number.NaN;
    return Number(trimmed);
  }
  return value;
}, z.number().int().finite().min(1, "Must be ≥ 1"));

export const checkoutLoanSchema = z
  .object({
    itemId: z.string().trim().min(1, "Item is required"),
    borrower: z.string().trim().min(1, "Borrower is required"),
    event: z.string().trim().min(1, "Event/reason is required"),
    quantity: positiveInt,
    dueDate: z.string().trim().optional().nullable(),
    permanent: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.permanent) return;
    if (!data.dueDate) {
      ctx.addIssue({
        code: "custom",
        message: "Due date is required unless permanent",
        path: ["dueDate"],
      });
      return;
    }
    const due = parseDateOnlyEndOfDayBrussels(data.dueDate);
    if (!due) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid due date",
        path: ["dueDate"],
      });
      return;
    }
    if (due.getTime() < startOfTodayBrussels().getTime()) {
      ctx.addIssue({
        code: "custom",
        message: "Due date cannot be in the past",
        path: ["dueDate"],
      });
    }
  });

export const returnLoanSchema = z.object({
  quantity: positiveInt.optional(),
});

export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
export type CheckoutLoanInput = z.infer<typeof checkoutLoanSchema>;
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>;

