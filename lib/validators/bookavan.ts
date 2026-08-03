import { z } from "zod";
import {
  parseBookingDateTime,
  START_GRACE_MS,
} from "@/lib/bookavan/datetime";

export const createReservationSchema = z
  .object({
    driver: z.string().trim().min(1, "Driver is required"),
    entityId: z.string().trim().min(1, "Department is required"),
    startAt: z.string().trim().min(1, "Start is required"),
    endAt: z.string().trim().min(1, "End is required"),
    destination: z.string().trim().min(1, "Destination is required"),
    reason: z.string().trim().min(1, "Reason is required"),
    notes: z.string().trim().optional().nullable(),
    claimAccepted: z.boolean().refine((v) => v === true, {
      message: "Claim terms must be accepted",
    }),
  })
  .superRefine((data, ctx) => {
    const start = parseBookingDateTime(data.startAt);
    const end = parseBookingDateTime(data.endAt);
    if (!start || !end) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid start or end date",
        path: ["startAt"],
      });
      return;
    }
    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        message: "End must be after start",
        path: ["endAt"],
      });
    }
    const earliest = Date.now() - START_GRACE_MS;
    if (start.getTime() < earliest) {
      ctx.addIssue({
        code: "custom",
        message: "Start cannot be in the past",
        path: ["startAt"],
      });
    }
  });

export const availabilityQuerySchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    const from = parseBookingDateTime(data.from);
    const to = parseBookingDateTime(data.to);
    if (!from || !to) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid from or to date",
        path: ["from"],
      });
      return;
    }
    if (to <= from) {
      ctx.addIssue({
        code: "custom",
        message: "to must be after from",
        path: ["to"],
      });
    }
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
