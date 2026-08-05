"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const VEHICLE_PHOTO_SRC = "/api/bookavan/vehicle-photo";

export function VehiclePhotoHero() {
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={loaded ? "overflow-hidden rounded-lg" : "hidden"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={VEHICLE_PHOTO_SRC}
        alt={t("bookavanVehiclePhotoAlt")}
        className="block w-full max-h-[22rem] object-cover"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
    </div>
  );
}
