// src/components/AdSenseScript.tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
    dataLayer: any[];
  }
}

type AdSenseScriptProps = {
  pubId?: string;
};

export default function AdSenseScript({ pubId = "ca-pub-XXXXXXXXXX" }: AdSenseScriptProps) {
  useEffect(() => {
    // Push to dataLayer for Google Tag Manager
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "pageview" });
    }
  }, []);

  return (
    <>
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
        crossOrigin="anonymous"
      />
    </>
  );
}
