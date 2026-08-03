"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { formatInBookingTimezone } from "@/lib/bookavan/datetime";
import type { TranslationKey } from "@/lib/translations";

export type ReservationRow = {
  id: string;
  status: string;
  driver: string | null;
  department: string | null;
  destination: string | null;
  reason: string | null;
  startAt: string | null;
  endAt: string | null;
  createdByEmail: string;
  rejectionReason?: string | null;
};

type ReservationHistoryProps = {
  reservations: ReservationRow[];
  currentUserEmail?: string | null;
  canForceCancel?: boolean;
  cancellingId?: string | null;
  onCancel: (id: string) => void;
};

function formatRange(startAt: string | null, endAt: string | null, locale: string) {
  if (!startAt || !endAt) return "—";
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  };
  return `${formatInBookingTimezone(startAt, locale, opts)} → ${formatInBookingTimezone(endAt, locale, opts)}`;
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  PENDING: "bookavanStatusPending",
  ACTIVE: "bookavanStatusActive",
  CANCELLED: "bookavanStatusCancelled",
  REJECTED: "bookavanStatusRejected",
};

export function ReservationHistory({
  reservations,
  currentUserEmail,
  canForceCancel = false,
  cancellingId,
  onCancel,
}: ReservationHistoryProps) {
  const { t, language } = useLanguage();
  const locale = language === "fr" ? "fr-BE" : language === "en" ? "en-GB" : "nl-BE";

  const statusLabel = (status: string) =>
    t(STATUS_KEYS[status] || "bookavanStatusActive");

  const statusClass = (status: string) => {
    if (status === "ACTIVE") return "bg-emerald-50 text-emerald-800";
    if (status === "PENDING") return "bg-amber-50 text-amber-900";
    if (status === "REJECTED") return "bg-red-50 text-red-800";
    if (status === "CANCELLED") return "bg-gray-100 text-gray-700";
    return "bg-amber-50 text-amber-800";
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-[var(--spoq-line)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--spoq-line)]">
        <h2 className="text-lg font-semibold text-[var(--spoq-navy)]">
          {t("bookavanHistoryTitle")}
        </h2>
        <p className="text-sm text-[var(--spoq-muted)] mt-1">
          {t("bookavanHistorySubtitle")}
        </p>
      </div>

      {reservations.length === 0 ? (
        <p className="px-6 py-8 text-sm text-[var(--spoq-muted)]">
          {t("bookavanNoReservations")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--spoq-soft)] text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("bookavanPeriod")}</th>
                <th className="px-4 py-3 font-semibold">{t("bookavanDriver")}</th>
                <th className="px-4 py-3 font-semibold">{t("bookavanDepartment")}</th>
                <th className="px-4 py-3 font-semibold">{t("bookavanDestination")}</th>
                <th className="px-4 py-3 font-semibold">{t("bookavanReason")}</th>
                <th className="px-4 py-3 font-semibold">{t("status")}</th>
                <th className="px-4 py-3 font-semibold">{t("bookavanActions")}</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((row) => {
                const isOwner =
                  row.createdByEmail.toLowerCase() ===
                  (currentUserEmail || "").toLowerCase();
                const hasStarted = Boolean(
                  row.startAt && new Date(row.startAt).getTime() <= Date.now()
                );
                const canCancel =
                  (row.status === "ACTIVE" || row.status === "PENDING") &&
                  (canForceCancel || (isOwner && !hasStarted));

                return (
                  <tr key={row.id} className="border-t border-[var(--spoq-line)]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatRange(row.startAt, row.endAt, locale)}
                    </td>
                    <td className="px-4 py-3">{row.driver || "—"}</td>
                    <td className="px-4 py-3">{row.department || "—"}</td>
                    <td className="px-4 py-3">{row.destination || "—"}</td>
                    <td className="px-4 py-3">
                      <div>{row.reason || "—"}</div>
                      {row.status === "REJECTED" && row.rejectionReason ? (
                        <p className="mt-1 text-xs text-red-700">
                          {t("bookavanRejectionReason")}: {row.rejectionReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(row.status)}`}
                      >
                        <span aria-hidden>
                          {row.status === "ACTIVE"
                            ? "●"
                            : row.status === "CANCELLED"
                              ? "○"
                              : row.status === "REJECTED"
                                ? "✕"
                                : "◆"}
                        </span>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canCancel ? (
                        <button
                          type="button"
                          disabled={cancellingId === row.id}
                          onClick={() => onCancel(row.id)}
                          className="text-[var(--spoq-teal-2)] font-medium hover:underline disabled:opacity-50"
                        >
                          {cancellingId === row.id
                            ? t("bookavanCancelling")
                            : t("bookavanCancel")}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
