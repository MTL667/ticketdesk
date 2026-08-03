"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type ReturnModalProps = {
  open: boolean;
  loanId: string;
  maxQuantity: number;
  borrower: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: { loanId: string; quantity: number }) => void;
};

export function ReturnModal({
  open,
  loanId,
  maxQuantity,
  borrower,
  submitting,
  error,
  onClose,
  onSubmit,
}: ReturnModalProps) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuantity(maxQuantity);
    setClientError(null);
  }, [open, maxQuantity]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > maxQuantity) {
      setClientError(t("marketingReturnInvalidQty"));
      return;
    }
    onSubmit({ loanId, quantity });
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
      className="rounded-xl p-0 w-[min(100%,28rem)] shadow-xl backdrop:bg-black/40"
      onClose={() => {
        if (!submitting) onClose();
      }}
      onCancel={handleDismiss}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--spoq-navy)]">
            {t("marketingReturnTitle")}
          </h2>
          <p className="text-sm text-[var(--spoq-muted)] mt-1">
            {borrower} · {t("marketingQty")}: {maxQuantity}
          </p>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="return-qty" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("marketingReturnQty")} *
          </label>
          <input
            id="return-qty"
            type="number"
            min={1}
            max={maxQuantity}
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2.5"
          />
        </div>

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
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--spoq-teal)" }}
          >
            {submitting ? t("marketingSaving") : t("marketingReturn")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
