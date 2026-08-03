"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export type MarketingItem = {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  total: number;
  available: number;
  loaned: number;
  minStock: number;
  notes?: string | null;
  entityId: string | null;
  entityName: string | null;
  needsReorder: boolean;
  isBakwagen?: boolean;
};

type ItemGridProps = {
  items: MarketingItem[];
  onEdit: (item: MarketingItem) => void;
};

export function ItemGrid({ items, onEdit }: ItemGridProps) {
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm px-6 py-10 text-sm text-[var(--spoq-muted)]">
        {t("marketingNoItems")}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm p-5 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[var(--spoq-navy)] text-lg">
                {item.name}
              </h3>
              <p className="text-sm text-[var(--spoq-muted)] mt-1">
                {item.entityName || "—"} · {item.category || "—"}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {item.isBakwagen && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-[var(--spoq-soft)] text-[var(--spoq-navy)] px-2.5 py-1">
                  <span aria-hidden>🚚</span>
                  {t("marketingBakwagenBadge")}
                </span>
              )}
              {item.needsReorder && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 px-2.5 py-1">
                  <span aria-hidden>!</span>
                  {t("marketingReorderBadge")}
                </span>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-[var(--spoq-muted)] text-xs uppercase tracking-wide">
                {t("marketingTotal")}
              </dt>
              <dd className="font-semibold text-gray-900">{item.total}</dd>
            </div>
            <div>
              <dt className="text-[var(--spoq-muted)] text-xs uppercase tracking-wide">
                {t("marketingAvailable")}
              </dt>
              <dd className="font-semibold text-emerald-700">{item.available}</dd>
            </div>
            <div>
              <dt className="text-[var(--spoq-muted)] text-xs uppercase tracking-wide">
                {t("marketingLoaned")}
              </dt>
              <dd className="font-semibold text-[var(--spoq-teal-2)]">{item.loaned}</dd>
            </div>
          </dl>

          <p className="text-xs text-[var(--spoq-muted)]">
            {t("marketingLocation")}: {item.location || "—"}
          </p>

          <div className="mt-auto flex gap-2 pt-1">
            <Link
              href={`/marketing/items/${item.id}`}
              className="flex-1 text-center rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--spoq-teal)" }}
            >
              {t("marketingView")}
            </Link>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg px-3 py-2 text-sm font-semibold border border-[var(--spoq-line)] text-[var(--spoq-navy)] hover:bg-[var(--spoq-soft)]"
            >
              {t("marketingEdit")}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
