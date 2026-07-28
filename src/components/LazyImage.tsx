import React, { useState, useEffect, useRef } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export default function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  ...props
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use IntersectionObserver so image loads ONLY when scrolled into view (like Vercel/Next)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px" } // trigger 100px before reaching viewport
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-slate-900/80 ${containerClassName}`}>
      {/* Vercel-style Shimmer / Skeleton Loader while loading or not yet in view */}
      {(!isLoaded || !isInView) && !hasError && (
        <div className="absolute inset-0 bg-slate-800/90 flex items-center justify-center z-10">
          <div className="w-full h-full bg-gradient-to-r from-slate-800 via-slate-700/40 to-slate-800 bg-[length:200%_100%] animate-[shimmer_1.8s_infinite]" />
        </div>
      )}

      {/* Actual Image loaded lazily when in view */}
      {isInView ? (
        <img
          src={hasError ? "https://mc-heads.net/avatar/MHF_Steve/64" : src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={`transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105"
          } ${className}`}
          {...props}
        />
      ) : null}
    </div>
  );
}

