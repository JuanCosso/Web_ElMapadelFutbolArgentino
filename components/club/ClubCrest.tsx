"use client";

import React from "react";

export function ClubCrest({
  crestUrl,
  slug,
  fullName,
}: {
  crestUrl?: string | null;
  slug: string;
  fullName: string;
}) {
  const initialSrc = crestUrl || `/badges/${slug}.webp`;

  return (
    <img
      src={initialSrc}
      alt={`Escudo de ${fullName}`}
      className="w-48 h-48 object-contain"
      onError={(e) => {
        const target = e.currentTarget;
        const fallback = `/badges/${slug}.webp`;
        if (target.src !== new URL(fallback, window.location.href).href) {
          target.src = fallback;
        }
      }}
    />
  );
}
