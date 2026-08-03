"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type ClaimDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ClaimDialog({ open, onClose }: ClaimDialogProps) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl p-0 max-w-lg w-[min(100%,32rem)] shadow-xl backdrop:bg-black/40"
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-[var(--spoq-navy)] mb-3">
          {t("bookavanClaimTitle")}
        </h2>
        <div className="text-sm text-gray-700 space-y-3 leading-relaxed">
          <p>{t("bookavanClaimBody1")}</p>
          <p>{t("bookavanClaimBody2")}</p>
          <p>{t("bookavanClaimBody3")}</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ background: "var(--spoq-teal)" }}
          >
            {t("bookavanClose")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
