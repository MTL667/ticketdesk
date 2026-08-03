"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { checkoutLoanSchema } from "@/lib/validators/marketing";

type CheckoutModalProps = {
  open: boolean;
  itemId: string;
  itemName: string;
  maxQuantity: number;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    itemId: string;
    borrower: string;
    event: string;
    quantity: number;
    dueDate: string | null;
    permanent: boolean;
  }) => void;
};

export function CheckoutModal({
  open,
  itemId,
  itemName,
  maxQuantity,
  submitting,
  error,
  onClose,
  onSubmit,
}: CheckoutModalProps) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [borrower, setBorrower] = useState("");
  const [event, setEvent] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [permanent, setPermanent] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setBorrower("");
    setEvent("");
    setQuantity(Math.min(1, Math.max(maxQuantity, 0)) || 1);
    setDueDate("");
    setPermanent(false);
    setClientError(null);
  }, [open, maxQuantity]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (maxQuantity <= 0) {
      setClientError(t("marketingCheckoutNoneAvailable"));
      return;
    }

    const parsed = checkoutLoanSchema.safeParse({
      itemId,
      borrower,
      event,
      quantity,
      dueDate: permanent ? null : dueDate || null,
      permanent,
    });

    if (!parsed.success) {
      setClientError(
        parsed.error.issues[0]?.message || t("marketingValidationError")
      );
      return;
    }

    if (parsed.data.quantity > maxQuantity) {
      setClientError(t("marketingCheckoutExceedsAvailable"));
      return;
    }

    onSubmit({
      itemId: parsed.data.itemId,
      borrower: parsed.data.borrower,
      event: parsed.data.event,
      quantity: parsed.data.quantity,
      dueDate: parsed.data.permanent ? null : parsed.data.dueDate || null,
      permanent: Boolean(parsed.data.permanent),
    });
  };

  const handleDismiss = (e?: { preventDefault: () => void }) => {
    if (submitting) {
      e?.preventDefault();
      return;
    }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl p-0 w-[min(100%,32rem)] shadow-xl backdrop:bg-black/40"
      onClose={() => {
        if (!submitting) onClose();
      }}
      onCancel={handleDismiss}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--spoq-navy)]">
            {t("marketingCheckoutTitle")}
          </h2>
          <p className="text-sm text-[var(--spoq-muted)] mt-1">
            {itemName} · {t("marketingAvailable")}: {maxQuantity}
          </p>
        </div>

        {maxQuantity <= 0 ? (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span aria-hidden className="mr-1">!</span>
            {t("marketingCheckoutNoneAvailable")}
          </p>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="checkout-borrower" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                {t("marketingBorrower")} *
              </label>
              <input
                id="checkout-borrower"
                required
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2.5"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="checkout-event" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                {t("marketingEvent")} *
              </label>
              <input
                id="checkout-event"
                required
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2.5"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="checkout-qty" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                {t("marketingQty")} *
              </label>
              <input
                id="checkout-qty"
                type="number"
                min={1}
                max={maxQuantity}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2.5"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="accent-[var(--spoq-teal)]"
              />
              {t("marketingPermanentLoan")}
            </label>
            {!permanent && (
              <div className="grid gap-1.5">
                <label htmlFor="checkout-due" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {t("marketingDueDate")} *
                </label>
                <input
                  id="checkout-due"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2.5"
                />
              </div>
            )}
          </div>
        )}

        {(clientError || error) && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {clientError || error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => handleDismiss()}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-semibold border border-[var(--spoq-line)] disabled:opacity-50"
          >
            {t("marketingCancel")}
          </button>
          <button
            type="submit"
            disabled={submitting || maxQuantity <= 0}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--spoq-teal)" }}
          >
            {submitting ? t("marketingSaving") : t("marketingCheckout")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
