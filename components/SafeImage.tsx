"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SafeImage({ src, alt, fill, width, height, priority, sizes, className = "", style }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || "/logo.svg");
  const [isFallback, setIsFallback] = useState(!src);

  useEffect(() => {
    if (!src) {
      setImgSrc("/logo.svg");
      setIsFallback(true);
    } else {
      setImgSrc(src);
      setIsFallback(false);
    }
  }, [src]);

  const handleError = () => {
    if (!isFallback) {
      setImgSrc("/logo.svg");
      setIsFallback(true);
    }
  };

  if (isFallback) {
    if (fill) {
      return (
        <div className={`absolute inset-0 flex items-center justify-center bg-[#141414]`}>
          <img src="/logo.svg" alt="" className="max-w-[35%] max-h-[35%] opacity-15 object-contain" />
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center bg-[#141414] ${className}`} style={{ width, height, ...style }}>
        <img src="/logo.svg" alt="" className="max-w-[50%] max-h-[50%] opacity-15 object-contain" />
      </div>
    );
  }

  if (fill) {
    return (
      <div className="absolute inset-0">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={className}
          style={style}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      className={className}
      style={style}
      onError={handleError}
    />
  );
}
