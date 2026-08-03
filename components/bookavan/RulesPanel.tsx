"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function RulesPanel() {
  const { t } = useLanguage();

  const rules = [
    t("bookavanRule1"),
    t("bookavanRule2"),
    t("bookavanRule3"),
    t("bookavanRule4"),
    t("bookavanRule5"),
  ];

  return (
    <section className="bg-white rounded-lg shadow-sm border border-[var(--spoq-line)] p-6">
      <h2 className="text-lg font-semibold text-[var(--spoq-navy)] mb-1">
        {t("bookavanRulesTitle")}
      </h2>
      <p className="text-sm text-[var(--spoq-muted)] mb-4">
        {t("bookavanRulesSubtitle")}
      </p>
      <ol className="space-y-3 list-decimal list-inside text-sm text-gray-700">
        {rules.map((rule) => (
          <li key={rule} className="leading-relaxed">
            {rule}
          </li>
        ))}
      </ol>
    </section>
  );
}
