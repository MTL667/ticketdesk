"use client";

import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export type GalleryPhoto = {
  id: string;
  url: string;
  isPrimary: boolean;
};

type PhotoGalleryProps = {
  photos: GalleryPhoto[];
  uploading: boolean;
  selectingPrimaryId: string | null;
  error: string | null;
  statusMessage: string | null;
  onUpload: (files: FileList | null) => void;
  onSetPrimary: (photoId: string) => void;
};

export function PhotoGallery({
  photos,
  uploading,
  selectingPrimaryId,
  error,
  statusMessage,
  onUpload,
  onSetPrimary,
}: PhotoGalleryProps) {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const primary = photos.find((p) => p.isPrimary) || photos[0] || null;

  return (
    <section
      className="bg-white rounded-lg border border-[var(--spoq-line)] shadow-sm p-6"
      aria-labelledby="photo-gallery-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2
            id="photo-gallery-heading"
            className="text-lg font-semibold text-[var(--spoq-navy)]"
          >
            {t("marketingPhotosTitle")}
          </h2>
          <p className="text-sm text-[var(--spoq-muted)] mt-1">
            {t("marketingPhotosHelp")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg px-3 py-2 text-sm font-semibold border border-[var(--spoq-line)] text-[var(--spoq-navy)] disabled:opacity-50"
          >
            {uploading ? t("marketingPhotosUploading") : t("marketingPhotosAddFile")}
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--spoq-teal)" }}
          >
            {t("marketingPhotosAddCamera")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {error && (
        <p
          className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
          role="alert"
        >
          {error}
        </p>
      )}
      {statusMessage && (
        <p
          className="mb-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
          role="status"
        >
          {statusMessage}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-[var(--spoq-muted)] py-8 text-center border border-dashed border-[var(--spoq-line)] rounded-lg">
          {t("marketingPhotosEmpty")}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-[16/10] w-full max-w-2xl overflow-hidden rounded-lg bg-gray-100 border border-[var(--spoq-line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primary!.url}
              alt={t("marketingPhotosMainAlt")}
              className="h-full w-full object-contain"
            />
            {primary?.isPrimary && (
              <span className="absolute top-2 left-2 text-xs font-semibold bg-white/90 text-[var(--spoq-navy)] px-2 py-1 rounded">
                {t("marketingPhotosPrimaryBadge")}
              </span>
            )}
          </div>

          <ul
            className="flex flex-wrap gap-2"
            aria-label={t("marketingPhotosThumbnails")}
          >
            {photos.map((photo) => {
              const selected = primary?.id === photo.id;
              const selecting = selectingPrimaryId !== null;
              const busy = selectingPrimaryId === photo.id;
              return (
                <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!photo.isPrimary && !selecting && !uploading) {
                        onSetPrimary(photo.id);
                      }
                    }}
                    disabled={uploading || selecting}
                    aria-pressed={photo.isPrimary}
                    aria-current={photo.isPrimary ? "true" : undefined}
                    aria-label={
                      photo.isPrimary
                        ? t("marketingPhotosPrimaryBadge")
                        : t("marketingPhotosSetPrimary")
                    }
                    className={`relative h-20 w-20 overflow-hidden rounded-md border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--spoq-teal)] disabled:opacity-80 ${
                      selected
                        ? "border-[var(--spoq-teal)]"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {busy && (
                      <span className="absolute inset-0 bg-black/40 text-white text-[10px] flex items-center justify-center font-semibold">
                        …
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
