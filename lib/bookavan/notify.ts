import { getMarketingEmails } from "@/lib/admin";
import {
  isSendGridConfigured,
  sendBookAVanApprovedNotification,
  sendBookAVanPendingNotification,
  sendBookAVanRejectedNotification,
} from "@/lib/sendgrid";
import { formatInBookingTimezone } from "@/lib/bookavan/datetime";

type ReservationMailSource = {
  driver: string | null;
  department: string | null;
  destination: string | null;
  reason: string | null;
  startAt: string | null;
  endAt: string | null;
  createdByEmail: string;
  rejectionReason?: string | null;
};

function toMailPayload(reservation: ReservationMailSource) {
  const locale = "nl-BE";
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  };
  return {
    driver: reservation.driver || "—",
    department: reservation.department || "—",
    destination: reservation.destination || "—",
    reason: reservation.reason || "—",
    startAt: reservation.startAt
      ? formatInBookingTimezone(reservation.startAt, locale, opts)
      : "—",
    endAt: reservation.endAt
      ? formatInBookingTimezone(reservation.endAt, locale, opts)
      : "—",
    requesterEmail: reservation.createdByEmail,
    rejectionReason: reservation.rejectionReason || undefined,
  };
}

async function safeSend(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error) {
    console.error(`[bookavan] ${label} email failed:`, error);
  }
}

export async function notifyMarketingOfPendingReservation(
  reservation: ReservationMailSource
) {
  const recipients = getMarketingEmails();
  if (recipients.length === 0) {
    console.log("[bookavan] No MARKETING_USERS configured; skip pending mail");
    return;
  }
  if (!isSendGridConfigured()) {
    console.log("[bookavan] SendGrid unset; skip pending mail");
    return;
  }
  await safeSend("pending", () =>
    sendBookAVanPendingNotification(recipients, toMailPayload(reservation))
  );
}

export async function notifyRequesterOfApproval(
  reservation: ReservationMailSource
) {
  if (!reservation.createdByEmail) return;
  if (!isSendGridConfigured()) {
    console.log("[bookavan] SendGrid unset; skip approve mail");
    return;
  }
  await safeSend("approve", () =>
    sendBookAVanApprovedNotification(
      reservation.createdByEmail,
      toMailPayload(reservation)
    )
  );
}

export async function notifyRequesterOfRejection(
  reservation: ReservationMailSource
) {
  if (!reservation.createdByEmail) return;
  if (!isSendGridConfigured()) {
    console.log("[bookavan] SendGrid unset; skip reject mail");
    return;
  }
  await safeSend("reject", () =>
    sendBookAVanRejectedNotification(
      reservation.createdByEmail,
      toMailPayload(reservation)
    )
  );
}
