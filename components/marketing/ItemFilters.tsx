"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type EntityOption = { id: string; name: string };

type ItemFiltersProps = {
  entities: EntityOption[];
  categories: string[];
  entityId: string;
  category: string;
  q: string;
  onEntityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
};

export function ItemFilters({
  entities,
  categories,
  entityId,
  category,
  q,
  onEntityChange,
  onCategoryChange,
  onQueryChange,
}: ItemFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm p-4 grid gap-3 md:grid-cols-3">
      <div className="grid gap-1.5">
        <label htmlFor="marketing-search" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {t("marketingSearch")}
        </label>
        <input
          id="marketing-search"
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("marketingSearchPlaceholder")}
          className="rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="marketing-entity" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {t("marketingEntity")}
        </label>
        <select
          id="marketing-entity"
          value={entityId}
          onChange={(e) => onEntityChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
        >
          <option value="">{t("marketingAllEntities")}</option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="marketing-category" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {t("marketingCategory")}
        </label>
        <select
          id="marketing-category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--spoq-teal)]/30 focus:border-[var(--spoq-teal)]"
        >
          <option value="">{t("marketingAllCategories")}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
