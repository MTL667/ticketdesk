"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClaimDialog } from "@/components/bookavan/ClaimDialog";
import { BOOKAVAN_TIMEZONE } from "@/lib/bookavan/datetime";
import { createReservationSchema } from "@/lib/validators/bookavan";

type EntityOption = { id: string; name: string };

type ReservationFormProps = {
  entities: EntityOption[];
  submitting: boolean;
  error: string | null;
  availabilityMessage: string | null;
  availabilityOk: boolean | null;
  formResetKey?: number;
  onCheckAvailability: (from: string, to: string) => void;
  onSubmit: (payload: {
    driver: string;
    entityId: string;
    startAt: string;
    endAt: string;
    destination: string;
    reason: string;
    notes: string;
    claimAccepted: boolean;
  }) => void;
};

export function ReservationForm({
  entities,
  submitting,
  error,
  availabilityMessage,
  availabilityOk,
  formResetKey = 0,
  onCheckAvailability,
  onSubmit,
}: ReservationFormProps) {
  const { t } = useLanguage();
  const [driver, setDriver] = useState("");
  const [entityId, setEntityId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [claimAccepted, setClaimAccepted] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const onCheckRef = useRef(onCheckAvailability);

  useEffect(() => {
    onCheckRef.current = onCheckAvailability;
  }, [onCheckAvailability]);

  useEffect(() => {
    if (formResetKey === 0) return;
    setDriver("");
    setStartAt("");
    setEndAt("");
    setDestination("");
    setReason("");
    setNotes("");
    setClaimAccepted(false);
    setClientError(null);
    if (entities.length > 0) {
      setEntityId(entities[0].id);
    }
  }, [formResetKey, entities]);

  useEffect(() => {
    if (!entityId && entities.length > 0) {
      setEntityId(entities[0].id);
    }
  }, [entities, entityId]);

  useEffect(() => {
    if (!startAt || !endAt) return;
    const timer = window.setTimeout(() => {
      onCheckRef.current(startAt, endAt);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [startAt, endAt]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setClientError(null);

    const payload = {
      driver,
      entityId,
      startAt,
      endAt,
      destination,
      reason,
      notes: notes || null,
      claimAccepted,
    };

    const parsed = createReservationSchema.safeParse(payload);
    if (!parsed.success) {
      setClientError(
        parsed.error.issues[0]?.message || t("bookavanValidationError")
      );
      return;
    }

    if (availabilityOk === false) {
      setClientError(t("bookavanUnavailableForPeriod"));
      return;
    }

    onSubmit({
      ...parsed.data,
      notes: parsed.data.notes || "",
      claimAccepted: true,
    });
  };

  const submitDisabled =
    submitting || !claimAccepted || availabilityOk === false;

  return (
    <section className="bg-white rounded-lg shadow-sm border border-[var(--spoq-line)] p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--spoq-navy)]">
          {t("bookavanFormTitle")}
        </h2>
        <p className="text-sm text-[var(--spoq-muted)] mt-1">
          {t("bookavanFormSubtitle")}
        </p>
        <p className="text-xs text-[var(--spoq-teal-2)] mt-2 font-medium">
          {t("bookavanTimezoneHint")} ({BOOKAVAN_TIMEZONE})
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="bookavan-driver" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("bookavanDriver")} *
          </label>
          <input
            id="bookavan-driver"
            required
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="bookavan-department" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("bookavanDepartment")} *
          </label>
          <select
            id="bookavan-department"
            required
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
          >
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="bookavan-start" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("bookavanStart")} *
          </label>
          <input
            id="bookavan-start"
            type="datetime-local"
            required
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="bookavan-end" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("bookavanEnd")} *
          </label>
          <input
            id="bookavan-end"
            type="datetime-local"
            required
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
          />
        </div>

        <div className="grid gap-1.5 md:col-span-2">
          <label htmlFor="bookavan-destination" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("bookavanDestination")} *
          </label>
          <input
            id="bookavan-destination"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
          />
        </div>

        <div className="grid gap-1.5 md:col-span-2">
          <label htmlFor="bookavan-reason" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("bookavanReason")} *
          </label>
          <input
            id="bookavan-reason"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
          />
        </div>

        <div className="grid gap-1.5 md:col-span-2">
          <label htmlFor="bookavan-notes" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("bookavanNotes")}
          </label>
          <textarea
            id="bookavan-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
          />
        </div>

        {availabilityMessage && (
          <div
            className={`md:col-span-2 rounded-lg px-4 py-3 text-sm ${
              availabilityOk
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-900 border border-amber-200"
            }`}
            role="status"
          >
            <span className="font-medium mr-1" aria-hidden>
              {availabilityOk ? "✓" : "!"}
            </span>
            {availabilityMessage}
          </div>
        )}

        <div className="md:col-span-2 rounded-xl border border-[var(--spoq-line)] bg-[var(--spoq-soft)] p-4 flex flex-col sm:flex-row gap-3 sm:items-start">
          <input
            id="bookavan-claim"
            type="checkbox"
            checked={claimAccepted}
            onChange={(e) => setClaimAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--spoq-teal)]"
            required
          />
          <div className="flex-1">
            <label htmlFor="bookavan-claim" className="text-sm font-medium text-gray-800">
              {t("bookavanClaimCheckbox")} *
            </label>
            <p className="text-xs text-[var(--spoq-muted)] mt-1">
              {t("bookavanClaimCheckboxHelp")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setClaimOpen(true)}
            className="text-sm font-semibold text-[var(--spoq-teal-2)] hover:underline whitespace-nowrap"
          >
            {t("bookavanViewTerms")}
          </button>
        </div>

        {(clientError || error) && (
          <p className="md:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {clientError || error}
          </p>
        )}

        <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <p className="text-xs text-[var(--spoq-muted)] max-w-md">
            {t("bookavanFormHint")}
          </p>
          <button
            type="submit"
            disabled={submitDisabled}
            className="inline-flex justify-center items-center rounded-lg px-5 py-2.5 text-white font-semibold disabled:opacity-50"
            style={{ background: "var(--spoq-teal)" }}
          >
            {submitting ? t("bookavanSubmitting") : t("bookavanSubmit")}
          </button>
        </div>
      </form>

      <ClaimDialog open={claimOpen} onClose={() => setClaimOpen(false)} />
    </section>
  );
}
