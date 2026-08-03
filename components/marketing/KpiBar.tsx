"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type KpiBarProps = {
  totalUnits: number;
  availableUnits: number;
  loanedUnits: number;
  reorderNeeded: number;
};

export function KpiBar({
  totalUnits,
  availableUnits,
  loanedUnits,
  reorderNeeded,
}: KpiBarProps) {
  const { t } = useLanguage();

  const items = [
    {
      label: t("marketingKpiTotal"),
      value: totalUnits,
      icon: "Σ",
      tone: "text-[var(--spoq-navy)]",
    },
    {
      label: t("marketingKpiAvailable"),
      value: availableUnits,
      icon: "✓",
      tone: "text-emerald-700",
    },
    {
      label: t("marketingKpiLoaned"),
      value: loanedUnits,
      icon: "↗",
      tone: "text-[var(--spoq-teal-2)]",
    },
    {
      label: t("marketingKpiReorder"),
      value: reorderNeeded,
      icon: "!",
      tone: reorderNeeded > 0 ? "text-amber-700" : "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm px-4 py-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--spoq-muted)]">
              {item.label}
            </p>
            <span className={`text-sm font-bold ${item.tone}`} aria-hidden>
              {item.icon}
            </span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${item.tone}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
