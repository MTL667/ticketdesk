export const BOOKAVAN_TIMEZONE = "Europe/Brussels";
export const START_GRACE_MS = 5 * 60 * 1000;

const LOCAL_DATE_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;

/** Parse wall-clock datetime in Europe/Brussels (or already-zoned ISO) to a UTC Date. */
export function parseBookingDateTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const match = LOCAL_DATE_RE.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);

  if (!isValidCalendarDate(year, month, day, hour, minute, second)) {
    return null;
  }

  return fromZonedLocal(
    year,
    month,
    day,
    hour,
    minute,
    second,
    BOOKAVAN_TIMEZONE
  );
}

export function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): boolean {
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day &&
    probe.getUTCHours() === hour &&
    probe.getUTCMinutes() === minute &&
    probe.getUTCSeconds() === second
  );
}

function fromZonedLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    dtf
      .formatToParts(new Date(utcGuess))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  ) as Record<string, string>;

  const asTz = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour === "24" ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return new Date(utcGuess - (asTz - utcGuess));
}

export function formatInBookingTimezone(
  iso: string | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleString(locale, {
    timeZone: BOOKAVAN_TIMEZONE,
    ...options,
  });
}

/** Parse YYYY-MM-DD as end of that day in Europe/Brussels. */
export function parseDateOnlyEndOfDayBrussels(dateOnly: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly.trim());
  if (!match) return null;
  return parseBookingDateTime(`${match[1]}-${match[2]}-${match[3]}T23:59:59`);
}

/** Start of "today" in Europe/Brussels as a UTC Date. */
export function startOfTodayBrussels(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKAVAN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return (
    parseBookingDateTime(`${map.year}-${map.month}-${map.day}T00:00:00`) ||
    now
  );
}
