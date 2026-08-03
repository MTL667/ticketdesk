"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

export type LoanHistoryRow = {
  id: string;
  type: string;
  status: string;
  quantity: number;
  borrower: string | null;
  driver: string | null;
  event: string | null;
  reason: string | null;
  dueDate: string | null;
  startAt: string | null;
  endAt: string | null;
  permanent: boolean;
  createdAt: string;
};

type LendingHistoryPanelProps = {
  loans: LoanHistoryRow[];
  truncated?: boolean;
};

const STATUS_KEYS: Record<string, TranslationKey> = {
  ACTIVE: "marketingStatusActive",
  RETURNED: "marketingStatusReturned",
  CANCELLED: "marketingStatusCancelled",
  OVERDUE: "marketingStatusOverdue",
};

export function LendingHistoryPanel({
  loans,
  truncated = false,
}: LendingHistoryPanelProps) {
  const { t, language } = useLanguage();
  const locale =
    language === "fr" ? "fr-BE" : language === "en" ? "en-GB" : "nl-BE";

  const statusLabel = (status: string) => {
    const key = STATUS_KEYS[status];
    return key ? t(key) : status;
  };

  return (
    <section className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--spoq-line)]">
        <h2 className="text-lg font-semibold text-[var(--spoq-navy)]">
          {t("marketingLendingHistory")}
        </h2>
        <p className="text-sm text-[var(--spoq-muted)] mt-1">
          {t("marketingLendingHistoryHelp")}
        </p>
      </div>

      {loans.length === 0 ? (
        <p className="px-5 py-8 text-sm text-[var(--spoq-muted)]">
          {t("marketingNoLoans")}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--spoq-soft)] text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t("marketingType")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3">{t("marketingWho")}</th>
                  <th className="px-4 py-3">{t("marketingQty")}</th>
                  <th className="px-4 py-3">{t("marketingPeriod")}</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const who =
                    loan.type === "RESERVATION"
                      ? loan.driver || "—"
                      : loan.borrower || "—";
                  const period =
                    loan.type === "RESERVATION"
                      ? loan.startAt && loan.endAt
                        ? `${new Date(loan.startAt).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })} → ${new Date(loan.endAt).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}`
                        : "—"
                      : loan.permanent
                        ? t("marketingPermanent")
                        : loan.dueDate
                          ? new Date(loan.dueDate).toLocaleDateString(locale)
                          : "—";

                  return (
                    <tr key={loan.id} className="border-t border-[var(--spoq-line)]">
                      <td className="px-4 py-3">
                        {loan.type === "RESERVATION"
                          ? t("marketingTypeReservation")
                          : t("marketingTypeInventory")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden>●</span>
                          {statusLabel(loan.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{who}</td>
                      <td className="px-4 py-3">{loan.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{period}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {truncated && (
            <p className="px-5 py-3 text-xs text-[var(--spoq-muted)] border-t border-[var(--spoq-line)]">
              {t("marketingLoansTruncated")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
