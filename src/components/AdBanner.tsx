// src/components/AdBanner.tsx
"use client";

import React, { useEffect, useRef } from "react";

type AdBannerProps = {
  slotId: number;
  adClient?: string;
  adSlot?: string;
  adImage?: string;
  adLink?: string;
  className?: string;
  height?: string;
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdBanner: React.FC<AdBannerProps> = ({
  slotId,
  adClient = "ca-pub-XXXXXXXXXX",
  adSlot,
  adImage,
  adLink,
  className = "",
  height = "100px",
}) => {
  const adRef = useRef<HTMLModElement>(null);
  
  // Generate ad slot ID based on position if not provided
  const slotIdString = adSlot || `theeyepress_${slotId}`;

  // If custom ad image is provided, show custom ad banner
  if (adImage) {
    return (
      <a
        href={adLink || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`block overflow-hidden rounded-lg ${className}`}
        style={{ height: height === "auto" ? "100px" : height }}
      >
        <img
          src={adImage}
          alt="Advertisement"
          className="w-full h-full object-contain hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }

  // If no custom ad and using placeholder AdSense ID, don't render anything
  if (adClient === "ca-pub-XXXXXXXXXX") {
    return null;
  }

  // Otherwise try to load Google AdSense
  useEffect(() => {
    if (window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, []);

  return (
    <div className={`ads-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          height: height,
          minHeight: height === "auto" ? "100px" : height,
        }}
        data-ad-client={adClient}
        data-ad-slot={slotIdString}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
