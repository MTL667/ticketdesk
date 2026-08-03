"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { KpiBar } from "@/components/marketing/KpiBar";
import { ItemFilters } from "@/components/marketing/ItemFilters";
import { ItemGrid, type MarketingItem } from "@/components/marketing/ItemGrid";
import {
  ItemFormModal,
  type ItemFormValues,
} from "@/components/marketing/ItemFormModal";
import {
  OpenLoansPanel,
  type OpenLoanRow,
} from "@/components/marketing/OpenLoansPanel";
import {
  PendingReservationsPanel,
  type PendingReservationRow,
} from "@/components/marketing/PendingReservationsPanel";
import { ReturnModal } from "@/components/marketing/ReturnModal";

type EntityOption = { id: string; name: string };

type Kpis = {
  totalUnits: number;
  availableUnits: number;
  loanedUnits: number;
  reorderNeeded: number;
};

export default function MarketingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const editRequestIdRef = useRef<string | null>(null);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<MarketingItem[]>([]);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [kpis, setKpis] = useState<Kpis>({
    totalUnits: 0,
    availableUnits: 0,
    loanedUnits: 0,
    reorderNeeded: 0,
  });
  const [entityId, setEntityId] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ItemFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [openLoans, setOpenLoans] = useState<OpenLoanRow[]>([]);
  const [pendingReservations, setPendingReservations] = useState<
    PendingReservationRow[]
  >([]);
  const [returnLoan, setReturnLoan] = useState<OpenLoanRow | null>(null);
  const [loanBusy, setLoanBusy] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [pendingBusyId, setPendingBusyId] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (entityId) params.set("entityId", entityId);
    if (category) params.set("category", category);
    if (debouncedQ) params.set("q", debouncedQ);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [entityId, category, debouncedQ]);

  const loadItems = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const [response, loansRes, pendingRes] = await Promise.all([
          fetch(`/api/marketing/items${queryString}`, { signal }),
          fetch("/api/marketing/loans", { signal }),
          fetch("/api/marketing/bookavan/pending", { signal }),
        ]);
        if (signal?.aborted) return;
        if (
          response.status === 401 ||
          loansRes.status === 401 ||
          pendingRes.status === 401
        ) {
          router.push("/signin");
          return;
        }
        if (
          response.status === 403 ||
          loansRes.status === 403 ||
          pendingRes.status === 403
        ) {
          setAllowed(false);
          return;
        }
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || t("marketingLoadError"));
          return;
        }
        const data = await response.json();
        setAllowed(true);
        setItems(data.items || []);
        setKpis(
          data.kpis || {
            totalUnits: 0,
            availableUnits: 0,
            loanedUnits: 0,
            reorderNeeded: 0,
          }
        );
        setEntities(data.filters?.entities || []);
        setCategories(data.filters?.categories || []);
        if (!loansRes.ok) {
          const loansErr = await loansRes.json().catch(() => ({}));
          setOpenLoans([]);
          setError(loansErr.message || t("marketingLoansLoadError"));
          return;
        }
        const loansData = await loansRes.json();
        setOpenLoans(loansData.loans || []);
        if (!pendingRes.ok) {
          const pendingErr = await pendingRes.json().catch(() => ({}));
          setPendingReservations([]);
          setPendingError(
            pendingErr.message || t("marketingPendingBookavanError")
          );
        } else {
          const pendingData = await pendingRes.json();
          setPendingReservations(pendingData.reservations || []);
          setPendingError(null);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(t("marketingLoadError"));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [queryString, t, router]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (status !== "authenticated") return;
    const controller = new AbortController();
    void loadItems(controller.signal);
    return () => controller.abort();
  }, [status, loadItems, router]);

  const openCreate = () => {
    if (entities.length === 0) {
      setError(t("marketingNoEntities"));
      return;
    }
    setModalMode("create");
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: MarketingItem) => {
    setModalMode("edit");
    editRequestIdRef.current = item.id;
    setEditing({
      id: item.id,
      name: item.name,
      entityId: item.entityId || entities[0]?.id || "",
      category: item.category || "",
      location: item.location || "",
      total: item.total,
      available: item.available,
      minStock: item.minStock,
      notes: item.notes || "",
    });
    setFormError(null);
    setModalOpen(true);
    void (async () => {
      const requestId = item.id;
      const res = await fetch(`/api/marketing/items/${item.id}`);
      if (!res.ok) return;
      if (editRequestIdRef.current !== requestId) return;
      const data = await res.json();
      if (editRequestIdRef.current !== requestId) return;
      setEditing({
        id: data.item.id,
        name: data.item.name,
        entityId: data.item.entityId || "",
        category: data.item.category || "",
        location: data.item.location || "",
        total: data.item.total,
        available: data.item.available,
        minStock: data.item.minStock,
        notes: data.item.notes || "",
      });
    })();
  };

  const handleSubmit = async (values: ItemFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: values.name,
        entityId: values.entityId,
        category: values.category,
        location: values.location || null,
        total: values.total,
        available: values.available,
        minStock: values.minStock,
        notes: values.notes || null,
      };

      const response = await fetch(
        modalMode === "create"
          ? "/api/marketing/items"
          : `/api/marketing/items/${values.id}`,
        {
          method: modalMode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.message || t("marketingSaveError"));
        return;
      }
      setModalOpen(false);
      await loadItems();
    } catch {
      setFormError(t("marketingSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing?.id) return;
    if (!window.confirm(t("marketingDeleteConfirm"))) return;
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch(`/api/marketing/items/${editing.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.message || t("marketingDeleteError"));
        return;
      }
      setModalOpen(false);
      await loadItems();
    } catch {
      setFormError(t("marketingDeleteError"));
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReservation = async (id: string) => {
    setPendingBusyId(id);
    setPendingError(null);
    try {
      const response = await fetch(`/api/marketing/bookavan/${id}/approve`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPendingError(data.message || t("marketingApproveError"));
        return;
      }
      await loadItems();
    } catch {
      setPendingError(t("marketingApproveError"));
    } finally {
      setPendingBusyId(null);
    }
  };

  const handleRejectReservation = async (id: string, reason: string) => {
    setPendingBusyId(id);
    setPendingError(null);
    try {
      const response = await fetch(`/api/marketing/bookavan/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPendingError(data.message || t("marketingRejectError"));
        return;
      }
      await loadItems();
    } catch {
      setPendingError(t("marketingRejectError"));
    } finally {
      setPendingBusyId(null);
    }
  };

  const handleReturn = async (payload: { loanId: string; quantity: number }) => {
    setLoanBusy(true);
    setLoanError(null);
    try {
      const response = await fetch(
        `/api/marketing/loans/${payload.loanId}/return`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: payload.quantity }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setLoanError(data.message || t("marketingReturnError"));
        return;
      }
      setReturnLoan(null);
      await loadItems();
    } catch {
      setLoanError(t("marketingReturnError"));
    } finally {
      setLoanBusy(false);
    }
  };

  if (status === "loading" || status === "unauthenticated" || (loading && allowed === null)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-xl font-semibold text-gray-700">
          {t("marketingLoading")}
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (allowed === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-sm border border-[var(--spoq-line)] p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold text-[var(--spoq-navy)] mb-2">
            {t("marketingForbiddenTitle")}
          </h1>
          <p className="text-sm text-gray-600 mb-6">{t("marketingForbiddenBody")}</p>
          <Link href="/" className="text-[var(--spoq-teal-2)] font-medium hover:underline">
            ← {t("back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-[var(--spoq-teal-2)] hover:underline">
                ← {t("back")}
              </Link>
              <h1 className="text-xl font-semibold text-[var(--spoq-navy)]">
                {t("marketingTitle")}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <Link href="/api/auth/signout" className="text-sm text-blue-600 hover:text-blue-800">
                {t("logout")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--spoq-teal)]">
              {t("marketingEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--spoq-navy)] tracking-tight">
              {t("marketingHeading")}
            </h2>
            <p className="mt-2 text-gray-600 max-w-2xl">{t("marketingIntro")}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={entities.length === 0}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--spoq-teal)" }}
          >
            {t("marketingAddItem")}
          </button>
        </div>

        <KpiBar {...kpis} />
        <ItemFilters
          entities={entities}
          categories={categories}
          entityId={entityId}
          category={category}
          q={q}
          onEntityChange={setEntityId}
          onCategoryChange={setCategory}
          onQueryChange={setQ}
        />

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-[var(--spoq-muted)]">{t("marketingLoading")}</p>
        ) : (
          <ItemGrid items={items} onEdit={openEdit} />
        )}

        <PendingReservationsPanel
          reservations={pendingReservations}
          busyId={pendingBusyId}
          error={pendingError}
          onApprove={handleApproveReservation}
          onReject={handleRejectReservation}
        />

        <OpenLoansPanel
          loans={openLoans}
          showItemName
          onReturn={(loan) => {
            setLoanError(null);
            setReturnLoan(loan);
          }}
        />
      </main>

      <ItemFormModal
        open={modalOpen}
        mode={modalMode}
        entities={entities}
        initial={editing}
        submitting={saving}
        error={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
      />

      {returnLoan && (
        <ReturnModal
          open={Boolean(returnLoan)}
          loanId={returnLoan.id}
          maxQuantity={returnLoan.quantity}
          borrower={returnLoan.borrower || "—"}
          submitting={loanBusy}
          error={loanError}
          onClose={() => setReturnLoan(null)}
          onSubmit={handleReturn}
        />
      )}
    </div>
  );
}
