"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  LendingHistoryPanel,
  type LoanHistoryRow,
} from "@/components/marketing/LendingHistoryPanel";
import {
  ItemFormModal,
  type ItemFormValues,
} from "@/components/marketing/ItemFormModal";
import { CheckoutModal } from "@/components/marketing/CheckoutModal";
import { ReturnModal } from "@/components/marketing/ReturnModal";
import {
  OpenLoansPanel,
  type OpenLoanRow,
} from "@/components/marketing/OpenLoansPanel";
import {
  PhotoGallery,
  type GalleryPhoto,
} from "@/components/marketing/PhotoGallery";

type ItemDetail = {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  total: number;
  available: number;
  loaned: number;
  minStock: number;
  notes: string | null;
  entityId: string | null;
  entityName: string | null;
  needsReorder: boolean;
  slug: string | null;
  isBakwagen?: boolean;
};

type EntityOption = { id: string; name: string };

export default function MarketingItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useLanguage();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loans, setLoans] = useState<LoanHistoryRow[]>([]);
  const [openLoans, setOpenLoans] = useState<OpenLoanRow[]>([]);
  const [loansTruncated, setLoansTruncated] = useState(false);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [returnLoan, setReturnLoan] = useState<OpenLoanRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [loanBusy, setLoanBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [selectingPrimaryId, setSelectingPrimaryId] = useState<string | null>(
    null
  );
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const photoUploadAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      photoUploadAbortRef.current?.abort();
    };
  }, []);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const [itemRes, listRes, openRes] = await Promise.all([
          fetch(`/api/marketing/items/${params.id}`, { signal }),
          fetch("/api/marketing/items", { signal }),
          fetch(
            `/api/marketing/loans?itemId=${encodeURIComponent(params.id)}`,
            { signal }
          ),
        ]);
        if (signal?.aborted) return;

        if (
          itemRes.status === 401 ||
          listRes.status === 401 ||
          openRes.status === 401
        ) {
          router.push("/signin");
          return;
        }
        if (
          itemRes.status === 403 ||
          listRes.status === 403 ||
          openRes.status === 403
        ) {
          setAllowed(false);
          return;
        }
        if (!itemRes.ok) {
          const data = await itemRes.json();
          setError(data.message || t("marketingLoadError"));
          setAllowed(true);
          return;
        }

        const itemData = await itemRes.json();
        setAllowed(true);
        setItem(itemData.item);
        setLoans(itemData.loans || []);
        setLoansTruncated(Boolean(itemData.loansMeta?.truncated));
        setPhotos(itemData.photos || []);

        if (listRes.ok) {
          const listData = await listRes.json();
          setEntities(listData.filters?.entities || []);
        }
        if (!openRes.ok) {
          const openErr = await openRes.json().catch(() => ({}));
          setOpenLoans([]);
          setError(openErr.message || t("marketingLoansLoadError"));
          return;
        }
        const openData = await openRes.json();
        setOpenLoans(openData.loans || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(t("marketingLoadError"));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [params.id, t, router]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (status !== "authenticated") return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [status, load, router]);

  const formValues: ItemFormValues | null = item
    ? {
        id: item.id,
        name: item.name,
        entityId: item.entityId || "",
        category: item.category || "",
        location: item.location || "",
        total: item.total,
        available: item.available,
        minStock: item.minStock,
        notes: item.notes || "",
      }
    : null;

  const handleSubmit = async (values: ItemFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch(`/api/marketing/items/${values.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          entityId: values.entityId,
          category: values.category,
          location: values.location || null,
          total: values.total,
          available: values.available,
          minStock: values.minStock,
          notes: values.notes || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.message || t("marketingSaveError"));
        return;
      }
      setModalOpen(false);
      await load();
    } catch {
      setFormError(t("marketingSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!window.confirm(t("marketingDeleteConfirm"))) return;
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch(`/api/marketing/items/${item.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.message || t("marketingDeleteError"));
        return;
      }
      setModalOpen(false);
      router.push("/marketing");
    } catch {
      setFormError(t("marketingDeleteError"));
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async (payload: {
    itemId: string;
    borrower: string;
    event: string;
    quantity: number;
    dueDate: string | null;
    permanent: boolean;
  }) => {
    setLoanBusy(true);
    setLoanError(null);
    try {
      const response = await fetch("/api/marketing/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoanError(data.message || t("marketingCheckoutError"));
        return;
      }
      setCheckoutOpen(false);
      await load();
    } catch {
      setLoanError(t("marketingCheckoutError"));
    } finally {
      setLoanBusy(false);
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
      await load();
    } catch {
      setLoanError(t("marketingReturnError"));
    } finally {
      setLoanBusy(false);
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !item) return;
    photoUploadAbortRef.current?.abort();
    const controller = new AbortController();
    photoUploadAbortRef.current = controller;
    setPhotoUploading(true);
    setPhotoError(null);
    setPhotoStatus(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      const response = await fetch(`/api/marketing/items/${item.id}/photos`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (response.status === 401) {
        router.push("/signin");
        return;
      }
      const data = await response.json();
      // 207 Multi-Status counts as ok for partial success
      if (!response.ok && response.status !== 207) {
        setPhotoError(data.message || t("marketingPhotosUploadError"));
        return;
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setPhotoError(t("marketingPhotosUploadPartial"));
      } else {
        setPhotoStatus(t("marketingPhotosUploadSuccess"));
      }
      const listRes = await fetch(`/api/marketing/items/${item.id}/photos`, {
        signal: controller.signal,
      });
      if (listRes.status === 401) {
        router.push("/signin");
        return;
      }
      if (listRes.ok) {
        const listData = await listRes.json();
        setPhotos(listData.photos || []);
      } else if (Array.isArray(data.photos)) {
        setPhotos((prev) => [...prev, ...data.photos]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setPhotoError(t("marketingPhotosUploadError"));
    } finally {
      if (!controller.signal.aborted) setPhotoUploading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!item || selectingPrimaryId) return;
    setSelectingPrimaryId(photoId);
    setPhotoError(null);
    setPhotoStatus(null);
    try {
      const response = await fetch(
        `/api/marketing/items/${item.id}/photos/${photoId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrimary: true }),
        }
      );
      if (response.status === 401) {
        router.push("/signin");
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setPhotoError(data.message || t("marketingPhotosPrimaryError"));
        return;
      }
      const primaryId = data.photo?.id || photoId;
      setPhotos((prev) =>
        prev.map((p) => ({
          ...p,
          isPrimary: p.id === primaryId,
        }))
      );
      setPhotoStatus(t("marketingPhotosPrimarySuccess"));
    } catch {
      setPhotoError(t("marketingPhotosPrimaryError"));
    } finally {
      setSelectingPrimaryId(null);
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
              <Link
                href="/marketing"
                className="text-sm text-[var(--spoq-teal-2)] hover:underline"
              >
                ← {t("marketingBackToDashboard")}
              </Link>
              <h1 className="text-xl font-semibold text-[var(--spoq-navy)]">
                {item?.name || t("marketingTitle")}
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
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {item && (
          <section className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--spoq-teal)]">
                  {t("marketingItemDetail")}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-[var(--spoq-navy)]">
                  {item.name}
                </h2>
                <p className="mt-2 text-sm text-[var(--spoq-muted)]">
                  {item.entityName || "—"} · {item.category || "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.isBakwagen && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--spoq-navy)] bg-[var(--spoq-soft)] px-2.5 py-1 rounded-full">
                      <span aria-hidden>🚚</span>
                      {t("marketingBakwagenBadge")}
                    </span>
                  )}
                  {item.needsReorder && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                      <span aria-hidden>!</span>
                      {t("marketingReorderBadge")}
                    </span>
                  )}
                </div>
                {item.isBakwagen && (
                  <p className="mt-3 text-sm text-[var(--spoq-muted)] max-w-2xl">
                    {t("marketingBakwagenBridgeHelp")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!item.isBakwagen && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoanError(null);
                      setCheckoutOpen(true);
                    }}
                    disabled={item.available <= 0}
                    className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--spoq-teal)" }}
                  >
                    {t("marketingCheckout")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setModalOpen(true);
                  }}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold border border-[var(--spoq-line)] text-[var(--spoq-navy)]"
                >
                  {t("marketingEdit")}
                </button>
              </div>
            </div>

            {item.available <= 0 && !item.isBakwagen && (
              <p className="mt-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <span aria-hidden className="mr-1">!</span>
                {t("marketingCheckoutNoneAvailable")}
              </p>
            )}

            <dl className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--spoq-muted)] font-semibold">
                  {t("marketingTotal")}
                </dt>
                <dd className="mt-1 font-semibold text-gray-900">{item.total}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--spoq-muted)] font-semibold">
                  {t("marketingAvailable")}
                </dt>
                <dd className="mt-1 font-semibold text-emerald-700">{item.available}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--spoq-muted)] font-semibold">
                  {t("marketingLoaned")}
                </dt>
                <dd className="mt-1 font-semibold text-[var(--spoq-teal-2)]">{item.loaned}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--spoq-muted)] font-semibold">
                  {t("marketingMinStock")}
                </dt>
                <dd className="mt-1 font-semibold text-gray-900">{item.minStock}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--spoq-muted)] font-semibold">
                  {t("marketingLocation")}
                </dt>
                <dd className="mt-1 font-semibold text-gray-900">{item.location || "—"}</dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs uppercase tracking-wide text-[var(--spoq-muted)] font-semibold">
                  {t("marketingNotes")}
                </dt>
                <dd className="mt-1 text-gray-700 whitespace-pre-wrap">
                  {item.notes || "—"}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {item && (
          <PhotoGallery
            photos={photos}
            uploading={photoUploading}
            selectingPrimaryId={selectingPrimaryId}
            error={photoError}
            statusMessage={photoStatus}
            onUpload={handlePhotoUpload}
            onSetPrimary={handleSetPrimary}
          />
        )}

        {item && !item.isBakwagen && (
          <OpenLoansPanel
            loans={openLoans}
            onReturn={(loan) => {
              setLoanError(null);
              setReturnLoan(loan);
            }}
          />
        )}

        <LendingHistoryPanel loans={loans} truncated={loansTruncated} />
      </main>

      <ItemFormModal
        open={modalOpen}
        mode="edit"
        entities={entities}
        initial={formValues}
        submitting={saving}
        error={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      {item && (
        <CheckoutModal
          open={checkoutOpen}
          itemId={item.id}
          itemName={item.name}
          maxQuantity={item.available}
          submitting={loanBusy}
          error={loanError}
          onClose={() => setCheckoutOpen(false)}
          onSubmit={handleCheckout}
        />
      )}

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
