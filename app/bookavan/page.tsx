"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AvailabilityCalendar } from "@/components/bookavan/AvailabilityCalendar";
import { ReservationForm } from "@/components/bookavan/ReservationForm";
import { RulesPanel } from "@/components/bookavan/RulesPanel";
import { VehiclePhotoHero } from "@/components/bookavan/VehiclePhotoHero";
import { VehicleStatusCard } from "@/components/bookavan/VehicleStatusCard";
import {
  ReservationHistory,
  type ReservationRow,
} from "@/components/bookavan/ReservationHistory";
import { formatInBookingTimezone } from "@/lib/bookavan/datetime";

type EntityOption = { id: string; name: string };

function formatShort(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  return formatInBookingTimezone(iso, locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function BookAVanPage() {
  const { data: session, status } = useSession();
  const { t, language } = useLanguage();
  const locale =
    language === "fr" ? "fr-BE" : language === "en" ? "en-GB" : "nl-BE";

  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [vehicleStatus, setVehicleStatus] = useState<"available" | "reserved">(
    "available"
  );
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [nextLabel, setNextLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(
    null
  );
  const [availabilityOk, setAvailabilityOk] = useState<boolean | null>(null);
  const [canForceCancel, setCanForceCancel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formResetKey, setFormResetKey] = useState(0);
  const [prefillStartAt, setPrefillStartAt] = useState<string | null>(null);
  const [prefillEndAt, setPrefillEndAt] = useState<string | null>(null);
  const [prefillKey, setPrefillKey] = useState(0);
  const availabilityAbortRef = useRef<AbortController | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const focusTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const refreshVehicleSnapshot = useCallback(async () => {
    const from = new Date();
    const to = new Date(from.getTime() + 60 * 60 * 1000);
    const response = await fetch(
      `/api/bookavan/availability?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`
    );
    if (!response.ok) return;
    const data = await response.json();
    setVehicleStatus(data.vehicleStatus === "reserved" ? "reserved" : "available");
    setActiveLabel(
      data.activeReservation
        ? `${data.activeReservation.driver} · ${formatShort(data.activeReservation.startAt, locale)}`
        : null
    );
    setNextLabel(
      data.nextReservation
        ? `${data.nextReservation.driver} · ${formatShort(data.nextReservation.startAt, locale)}`
        : null
    );
  }, [locale]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [entitiesRes, reservationsRes, adminRes, marketingRes] =
        await Promise.all([
          fetch("/api/bookavan/entities"),
          fetch("/api/bookavan/reservations"),
          fetch("/api/admin/check"),
          fetch("/api/marketing/check").catch(() => null),
        ]);

      if (entitiesRes.ok) {
        const data = await entitiesRes.json();
        setEntities(data.entities || []);
      }

      if (reservationsRes.ok) {
        const data = await reservationsRes.json();
        setReservations(data.reservations || []);
      }

      let force = false;
      if (adminRes.ok) {
        const data = await adminRes.json();
        force = Boolean(data.isAdmin);
      }
      if (marketingRes && marketingRes.ok) {
        const data = await marketingRes.json();
        force = force || Boolean(data.isMarketing);
      }
      setCanForceCancel(force);

      await refreshVehicleSnapshot();
    } finally {
      setLoading(false);
    }
  }, [refreshVehicleSnapshot]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status, loadData]);

  const onCheckAvailability = useCallback(
    async (from: string, to: string) => {
      availabilityAbortRef.current?.abort();
      const controller = new AbortController();
      availabilityAbortRef.current = controller;

      try {
        const response = await fetch(
          `/api/bookavan/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) {
          setAvailabilityOk(false);
          setAvailabilityMessage(data.message || t("bookavanAvailabilityError"));
          return;
        }
        setAvailabilityOk(data.available);
        setAvailabilityMessage(
          data.available
            ? t("bookavanAvailableForPeriod")
            : t("bookavanUnavailableForPeriod")
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAvailabilityOk(false);
        setAvailabilityMessage(t("bookavanAvailabilityError"));
      }
    },
    [t]
  );

  const handleSubmit = async (payload: {
    driver: string;
    entityId: string;
    startAt: string;
    endAt: string;
    destination: string;
    reason: string;
    notes: string;
    claimAccepted: boolean;
  }) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/bookavan/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          notes: payload.notes || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || t("bookavanCreateError"));
        return;
      }
      setAvailabilityMessage(t("bookavanCreateSuccess"));
      setAvailabilityOk(true);
      setFormResetKey((key) => key + 1);
      await loadData();
    } catch {
      setError(t("bookavanCreateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm(t("bookavanCancelConfirm"))) return;
    setCancellingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/bookavan/reservations/${id}/cancel`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || t("bookavanCancelError"));
        return;
      }
      await loadData();
    } catch {
      setError(t("bookavanCancelError"));
    } finally {
      setCancellingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-xl font-semibold text-gray-700">
          {t("bookavanLoading")}
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-[var(--spoq-teal-2)] hover:underline"
              >
                ← {t("back")}
              </Link>
              <h1 className="text-xl font-semibold text-[var(--spoq-navy)]">
                {t("bookavanTitle")}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {t("logout")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--spoq-teal)]">
            SPOQ · BookAVan
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--spoq-navy)] tracking-tight">
            {t("bookavanHeading")}
          </h2>
          <p className="mt-2 text-gray-600 max-w-2xl">{t("bookavanIntro")}</p>
        </div>

        <VehiclePhotoHero />

        <AvailabilityCalendar
          reservations={reservations}
          loading={loading}
          onSelectDay={(startAt, endAt) => {
            setPrefillStartAt(startAt);
            setPrefillEndAt(endAt);
            setPrefillKey((k) => k + 1);
            setAvailabilityMessage(null);
            setAvailabilityOk(null);
            formSectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
            if (focusTimeoutRef.current !== null) {
              window.clearTimeout(focusTimeoutRef.current);
            }
            focusTimeoutRef.current = window.setTimeout(() => {
              document.getElementById("bookavan-start")?.focus();
              focusTimeoutRef.current = null;
            }, 200);
          }}
        />

        <div
          ref={formSectionRef}
          className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] items-start"
        >
          <ReservationForm
            entities={entities}
            submitting={submitting}
            error={error}
            availabilityMessage={availabilityMessage}
            availabilityOk={availabilityOk}
            formResetKey={formResetKey}
            prefillStartAt={prefillStartAt}
            prefillEndAt={prefillEndAt}
            prefillKey={prefillKey}
            onCheckAvailability={onCheckAvailability}
            onSubmit={handleSubmit}
          />
          <div className="space-y-6">
            <VehicleStatusCard
              vehicleStatus={vehicleStatus}
              activeLabel={activeLabel}
              nextLabel={nextLabel}
            />
            <RulesPanel />
          </div>
        </div>

        <ReservationHistory
          reservations={reservations}
          currentUserEmail={session.user?.email}
          canForceCancel={canForceCancel}
          cancellingId={cancellingId}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
}
