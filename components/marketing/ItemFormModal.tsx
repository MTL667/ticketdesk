"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { itemCreateSchema } from "@/lib/validators/marketing";

type EntityOption = { id: string; name: string };

export type ItemFormValues = {
  id?: string;
  name: string;
  entityId: string;
  category: string;
  location: string;
  total: number;
  available: number;
  minStock: number;
  notes: string;
};

type ItemFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  entities: EntityOption[];
  initial?: ItemFormValues | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void;
  onDelete?: () => void;
};

const emptyValues = (entityId = ""): ItemFormValues => ({
  name: "",
  entityId,
  category: "",
  location: "",
  total: 1,
  available: 1,
  minStock: 0,
  notes: "",
});

export function ItemFormModal({
  open,
  mode,
  entities,
  initial,
  submitting,
  error,
  onClose,
  onSubmit,
  onDelete,
}: ItemFormModalProps) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<ItemFormValues>(emptyValues());
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setValues(initial);
    } else {
      setValues(emptyValues(entities[0]?.id || ""));
    }
    setClientError(null);
  }, [open, initial, entities]);

  const parseNumberInput = (raw: string): number =>
    raw === "" ? Number.NaN : Number(raw);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setClientError(null);

    if (entities.length === 0) {
      setClientError(t("marketingNoEntities"));
      return;
    }

    const parsed = itemCreateSchema.safeParse({
      ...values,
      notes: values.notes || null,
      location: values.location || null,
    });
    if (!parsed.success) {
      setClientError(
        parsed.error.issues[0]?.message || t("marketingValidationError")
      );
      return;
    }
    onSubmit({
      ...values,
      ...parsed.data,
      location: parsed.data.location || "",
      notes: parsed.data.notes || "",
      id: values.id,
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl p-0 w-[min(100%,36rem)] shadow-xl backdrop:bg-black/40"
      onClose={onClose}
      onCancel={onClose}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--spoq-navy)]">
            {mode === "create" ? t("marketingCreateItem") : t("marketingEditItem")}
          </h2>
          <p className="text-sm text-[var(--spoq-muted)] mt-1">
            {t("marketingFormHelp")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <label htmlFor="item-name" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("marketingName")} *
            </label>
            <input
              id="item-name"
              required
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="item-entity" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("marketingEntity")} *
            </label>
            <select
              id="item-entity"
              required
              disabled={entities.length === 0}
              value={values.entityId}
              onChange={(e) => setValues((v) => ({ ...v, entityId: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2.5 bg-white disabled:opacity-50"
            >
              {entities.length === 0 ? (
                <option value="">{t("marketingNoEntities")}</option>
              ) : (
                entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="item-category" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("marketingCategory")} *
            </label>
            <input
              id="item-category"
              required
              value={values.category}
              onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <label htmlFor="item-location" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("marketingLocation")}
            </label>
            <input
              id="item-location"
              value={values.location}
              onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="item-total" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("marketingTotal")} *
            </label>
            <input
              id="item-total"
              type="number"
              min={0}
              required
              value={Number.isNaN(values.total) ? "" : values.total}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  total: parseNumberInput(e.target.value),
                }))
              }
              className="rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="item-available" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("marketingAvailable")} *
            </label>
            <input
              id="item-available"
              type="number"
              min={0}
              required
              value={Number.isNaN(values.available) ? "" : values.available}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  available: parseNumberInput(e.target.value),
                }))
              }
              className="rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="item-minstock" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("marketingMinStock")} *
            </label>
            <input
              id="item-minstock"
              type="number"
              min={0}
              required
              value={Number.isNaN(values.minStock) ? "" : values.minStock}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  minStock: parseNumberInput(e.target.value),
                }))
              }
              className="rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <label htmlFor="item-notes" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("marketingNotes")}
            </label>
            <textarea
              id="item-notes"
              rows={3}
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>
        </div>

        {(clientError || error) && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {clientError || error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div>
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={submitting}
                className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-50"
              >
                {t("marketingDelete")}
              </button>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold border border-[var(--spoq-line)]"
            >
              {t("marketingCancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || entities.length === 0}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--spoq-teal)" }}
            >
              {submitting ? t("marketingSaving") : t("marketingSave")}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
