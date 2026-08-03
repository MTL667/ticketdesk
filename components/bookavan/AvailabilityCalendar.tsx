"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BOOKAVAN_TIMEZONE,
  buildBrusselsMonthGrid,
  defaultDayWindowDatetimeLocal,
  getBrusselsYmd,
  reservationOverlapsBrusselsDay,
  shiftBrusselsMonth,
} from "@/lib/bookavan/datetime";

export type CalendarReservation = {
  startAt: string | null;
  endAt: string | null;
  status: string;
};

type AvailabilityCalendarProps = {
  reservations: CalendarReservation[];
  loading?: boolean;
  onSelectDay: (startAt: string, endAt: string) => void;
};

export function AvailabilityCalendar({
  reservations,
  loading = false,
  onSelectDay,
}: AvailabilityCalendarProps) {
  const { t, language } = useLanguage();
  const locale =
    language === "fr" ? "fr-BE" : language === "en" ? "en-GB" : "nl-BE";

  const today = getBrusselsYmd();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);

  const busyDays = useMemo(() => {
    const set = new Set<string>();
    const active = reservations.filter((r) => {
      if (!r.startAt || !r.endAt) return false;
      const status = r.status.toUpperCase();
      if (status !== "PENDING" && status !== "ACTIVE") return false;
      const start = new Date(r.startAt).getTime();
      const end = new Date(r.endAt).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || start > end) return false;
      return true;
    });

    const grid = buildBrusselsMonthGrid(year, month);
    for (const cell of grid) {
      if (!cell) continue;
      const busy = active.some((r) =>
        reservationOverlapsBrusselsDay(
          cell.dateOnly,
          new Date(r.startAt!),
          new Date(r.endAt!)
        )
      );
      if (busy) set.add(cell.dateOnly);
    }
    return set;
  }, [reservations, year, month]);

  const cells = useMemo(
    () => buildBrusselsMonthGrid(year, month),
    [year, month]
  );

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: BOOKAVAN_TIMEZONE,
  }).format(
    new Date(Date.UTC(year, month - 1, 15, 12, 0, 0))
  );

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    });
    // 2024-01-01 was a Monday UTC
    const monday = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
      return formatter.format(d);
    });
  }, [locale]);

  const goMonth = (delta: number) => {
    const next = shiftBrusselsMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  return (
    <section
      className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm p-5"
      aria-labelledby="bookavan-calendar-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2
            id="bookavan-calendar-heading"
            className="text-lg font-semibold text-[var(--spoq-navy)]"
          >
            {t("bookavanCalendarTitle")}
          </h2>
          <p className="text-sm text-[var(--spoq-muted)] mt-1">
            {t("bookavanCalendarHelp")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="rounded-lg px-3 py-2 text-sm font-semibold border border-[var(--spoq-line)] text-[var(--spoq-navy)]"
            aria-label={t("bookavanCalendarPrev")}
          >
            ←
          </button>
          <p className="min-w-[10rem] text-center text-sm font-semibold text-[var(--spoq-navy)] capitalize">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="rounded-lg px-3 py-2 text-sm font-semibold border border-[var(--spoq-line)] text-[var(--spoq-navy)]"
            aria-label={t("bookavanCalendarNext")}
          >
            →
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-medium mb-3">
        <span className="inline-flex items-center gap-1.5 text-emerald-800">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          {t("bookavanCalendarAvailable")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-rose-800">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
          {t("bookavanCalendarUnavailable")}
        </span>
      </div>

      {loading && (
        <p className="text-sm text-[var(--spoq-muted)] mb-3" role="status">
          {t("bookavanLoading")}
        </p>
      )}

      <div
        className="grid grid-cols-7 gap-1.5"
        role="grid"
        aria-busy={loading}
        aria-label={monthLabel}
      >
        {weekdays.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--spoq-muted)] py-1"
            role="columnheader"
          >
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`pad-${index}`} className="min-h-11" />;
          }
          const unavailable = busyDays.has(cell.dateOnly);
          const isToday =
            cell.dateOnly ===
            `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;

          return (
            <button
              key={cell.dateOnly}
              type="button"
              role="gridcell"
              disabled={loading}
              onClick={() => {
                const window = defaultDayWindowDatetimeLocal(cell.dateOnly);
                if (window) onSelectDay(window.startAt, window.endAt);
              }}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${cell.dateOnly}: ${
                unavailable
                  ? t("bookavanCalendarUnavailable")
                  : t("bookavanCalendarAvailable")
              }`}
              className={`min-h-11 rounded-md border px-1 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--spoq-teal)] disabled:opacity-60 ${
                unavailable
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
              } ${isToday ? "ring-1 ring-[var(--spoq-teal)]" : ""}`}
            >
              <span className="block leading-none">{cell.day}</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide opacity-80">
                {unavailable ? "!" : "✓"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
