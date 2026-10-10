"use client";

import React, { useState } from "react";
import { getIconsClubUrl, IconsClubOptions } from "@/lib/iconsclub";

export interface IconsClubLogoProps extends IconsClubOptions {
  name: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackText?: string;
}

export function IconsClubLogo({
  name,
  size = 64,
  format = "png",
  radius,
  gray,
  invert,
  alt,
  className = "",
  style,
  fallbackText,
  ...props
}: IconsClubLogoProps) {
  const [error, setError] = useState(false);
  const logoUrl = getIconsClubUrl(name, { size, format, radius, gray, invert });

  if (error && fallbackText) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold bg-white/10 text-white rounded ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4, ...style }}
      >
        {fallbackText}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={alt || `${name} logo`}
      width={size}
      height={size}
      onError={() => setError(true)}
      className={`inline-block object-contain max-w-full max-h-full transition-opacity duration-200 ${className}`}
      style={{ objectFit: "contain", ...style }}
      loading="lazy"
      {...props}
    />
  );
}

export default IconsClubLogo;
