"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type VehicleStatusCardProps = {
  vehicleStatus: "available" | "reserved";
  nextLabel?: string | null;
  activeLabel?: string | null;
};

export function VehicleStatusCard({
  vehicleStatus,
  nextLabel,
  activeLabel,
}: VehicleStatusCardProps) {
  const { t } = useLanguage();
  const isAvailable = vehicleStatus === "available";

  return (
    <section className="rounded-lg shadow-sm overflow-hidden border border-[var(--spoq-line)]">
      <div
        className="p-5 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--spoq-navy), var(--spoq-navy-2))",
        }}
      >
        <p className="text-xs uppercase tracking-wider text-[var(--spoq-aqua)] font-semibold">
          {t("bookavanVehicleStatus")}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span
            className={`inline-flex h-3 w-3 rounded-full ${
              isAvailable ? "bg-emerald-400" : "bg-amber-300"
            }`}
            aria-hidden
          />
          <p className="text-xl font-semibold">
            {isAvailable
              ? t("bookavanStatusAvailable")
              : t("bookavanStatusReserved")}
          </p>
        </div>
        <p className="mt-2 text-sm text-white/70">
          {isAvailable
            ? t("bookavanStatusAvailableHelp")
            : t("bookavanStatusReservedHelp")}
        </p>
      </div>
      <div className="bg-white p-4 space-y-2 text-sm">
        {activeLabel && (
          <p>
            <span className="font-medium text-gray-700">
              {t("bookavanActiveNow")}:{" "}
            </span>
            <span className="text-gray-600">{activeLabel}</span>
          </p>
        )}
        {nextLabel && (
          <p>
            <span className="font-medium text-gray-700">
              {t("bookavanNextBooking")}:{" "}
            </span>
            <span className="text-gray-600">{nextLabel}</span>
          </p>
        )}
        {!activeLabel && !nextLabel && (
          <p className="text-[var(--spoq-muted)]">{t("bookavanNoUpcoming")}</p>
        )}
      </div>
    </section>
  );
}
