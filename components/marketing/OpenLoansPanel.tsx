"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

export type OpenLoanRow = {
  id: string;
  itemId: string;
  itemName: string | null;
  quantity: number;
  borrower: string | null;
  event: string | null;
  dueDate: string | null;
  permanent: boolean;
  status: string;
  overdue: boolean;
};

type OpenLoansPanelProps = {
  loans: OpenLoanRow[];
  showItemName?: boolean;
  onReturn: (loan: OpenLoanRow) => void;
};

const STATUS_KEYS: Record<string, TranslationKey> = {
  ACTIVE: "marketingStatusActive",
  OVERDUE: "marketingStatusOverdue",
};

export function OpenLoansPanel({
  loans,
  showItemName = false,
  onReturn,
}: OpenLoansPanelProps) {
  const { t, language } = useLanguage();
  const locale =
    language === "fr" ? "fr-BE" : language === "en" ? "en-GB" : "nl-BE";

  return (
    <section className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--spoq-line)]">
        <h2 className="text-lg font-semibold text-[var(--spoq-navy)]">
          {t("marketingOpenLoans")}
        </h2>
        <p className="text-sm text-[var(--spoq-muted)] mt-1">
          {t("marketingOpenLoansHelp")}
        </p>
      </div>

      {loans.length === 0 ? (
        <p className="px-5 py-8 text-sm text-[var(--spoq-muted)]">
          {t("marketingNoOpenLoans")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--spoq-soft)] text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                {showItemName && <th className="px-4 py-3">{t("marketingName")}</th>}
                <th className="px-4 py-3">{t("marketingBorrower")}</th>
                <th className="px-4 py-3">{t("marketingEvent")}</th>
                <th className="px-4 py-3">{t("marketingQty")}</th>
                <th className="px-4 py-3">{t("marketingDueDate")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("marketingActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="border-t border-[var(--spoq-line)]">
                  {showItemName && (
                    <td className="px-4 py-3">{loan.itemName || "—"}</td>
                  )}
                  <td className="px-4 py-3">{loan.borrower || "—"}</td>
                  <td className="px-4 py-3">{loan.event || "—"}</td>
                  <td className="px-4 py-3">{loan.quantity}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {loan.permanent
                      ? t("marketingPermanent")
                      : loan.dueDate
                        ? new Date(loan.dueDate).toLocaleDateString(locale)
                        : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        loan.overdue
                          ? "bg-amber-50 text-amber-900"
                          : "bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      <span aria-hidden>{loan.overdue ? "!" : "●"}</span>
                      {t(STATUS_KEYS[loan.status] || "marketingStatusActive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onReturn(loan)}
                      className="text-[var(--spoq-teal-2)] font-medium hover:underline"
                    >
                      {t("marketingReturn")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
