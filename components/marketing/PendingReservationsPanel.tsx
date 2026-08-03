"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatInBookingTimezone } from "@/lib/bookavan/datetime";

export type PendingReservationRow = {
  id: string;
  driver: string | null;
  department: string | null;
  destination: string | null;
  reason: string | null;
  startAt: string | null;
  endAt: string | null;
  createdByEmail: string;
};

type PendingReservationsPanelProps = {
  reservations: PendingReservationRow[];
  busyId?: string | null;
  error?: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
};

function formatRange(
  startAt: string | null,
  endAt: string | null,
  locale: string
) {
  if (!startAt || !endAt) return "—";
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  };
  return `${formatInBookingTimezone(startAt, locale, opts)} → ${formatInBookingTimezone(endAt, locale, opts)}`;
}

export function PendingReservationsPanel({
  reservations,
  busyId,
  error,
  onApprove,
  onReject,
}: PendingReservationsPanelProps) {
  const { t, language } = useLanguage();
  const locale =
    language === "fr" ? "fr-BE" : language === "en" ? "en-GB" : "nl-BE";
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const startReject = (id: string) => {
    setRejectingId(id);
    setReason("");
  };

  const cancelReject = () => {
    setRejectingId(null);
    setReason("");
  };

  const submitReject = (id: string) => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onReject(id, trimmed);
    setRejectingId(null);
    setReason("");
  };

  return (
    <section className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--spoq-line)]">
        <h2 className="text-lg font-semibold text-[var(--spoq-navy)]">
          {t("marketingPendingBookavan")}
        </h2>
        <p className="text-sm text-[var(--spoq-muted)] mt-1">
          {t("marketingPendingBookavanHelp")}
        </p>
      </div>

      {error && (
        <p className="mx-5 mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {reservations.length === 0 ? (
        <p className="px-5 py-8 text-sm text-[var(--spoq-muted)]">
          {t("marketingNoPendingBookavan")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--spoq-soft)] text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">{t("bookavanPeriod")}</th>
                <th className="px-4 py-3">{t("bookavanDriver")}</th>
                <th className="px-4 py-3">{t("bookavanDepartment")}</th>
                <th className="px-4 py-3">{t("bookavanDestination")}</th>
                <th className="px-4 py-3">{t("bookavanReason")}</th>
                <th className="px-4 py-3">{t("marketingRequester")}</th>
                <th className="px-4 py-3">{t("marketingActions")}</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((row) => {
                const busy = busyId === row.id;
                const rejecting = rejectingId === row.id;

                return (
                  <tr key={row.id} className="border-t border-[var(--spoq-line)]">
                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      {formatRange(row.startAt, row.endAt, locale)}
                    </td>
                    <td className="px-4 py-3 align-top">{row.driver || "—"}</td>
                    <td className="px-4 py-3 align-top">
                      {row.department || "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {row.destination || "—"}
                    </td>
                    <td className="px-4 py-3 align-top">{row.reason || "—"}</td>
                    <td className="px-4 py-3 align-top">{row.createdByEmail}</td>
                    <td className="px-4 py-3 align-top">
                      {rejecting ? (
                        <div className="space-y-2 min-w-[220px]">
                          <label className="block text-xs text-gray-600">
                            {t("marketingRejectReason")}
                            <textarea
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              rows={2}
                              className="mt-1 w-full rounded border border-[var(--spoq-line)] px-2 py-1.5 text-sm"
                              disabled={busy}
                            />
                          </label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              disabled={busy || !reason.trim()}
                              onClick={() => submitReject(row.id)}
                              className="text-red-700 font-medium hover:underline disabled:opacity-50"
                            >
                              {busy
                                ? t("marketingRejecting")
                                : t("marketingConfirmReject")}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={cancelReject}
                              className="text-gray-600 hover:underline disabled:opacity-50"
                            >
                              {t("bookavanClose")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onApprove(row.id)}
                            className="text-[var(--spoq-teal-2)] font-medium hover:underline disabled:opacity-50"
                          >
                            {busy
                              ? t("marketingApproving")
                              : t("marketingApprove")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => startReject(row.id)}
                            className="text-red-700 font-medium hover:underline disabled:opacity-50"
                          >
                            {t("marketingReject")}
                          </button>
                        </div>
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
