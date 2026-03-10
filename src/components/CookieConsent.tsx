// src/components/CookieConsent.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

type CookieConsentProps = {
  locale?: string;
};

const CookieConsent: React.FC<CookieConsentProps> = ({ locale = "bn" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (consent) {
      setIsHidden(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
    setTimeout(() => setIsHidden(true), 500);
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setIsVisible(false);
    setTimeout(() => setIsHidden(true), 500);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsHidden(true), 500);
  };

  if (isHidden) return null;

  return (
    <>
      <style jsx>{`
        .cookie-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          z-index: 99998;
          opacity: 0;
          visibility: hidden;
          transition: all 0.5s ease;
        }

        .cookie-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        .cookie-consent {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-top: 3px solid #A41E22;
          padding: 20px;
          z-index: 99999;
          transform: translateY(100%);
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cookie-consent.visible {
          transform: translateY(0);
        }

        .cookie-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: -50px;
          right: 0;
          background: #333;
          border: none;
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: #A41E22;
          transform: rotate(90deg);
        }

        .cookie-text {
          flex: 1;
          min-width: 280px;
        }

        .cookie-title {
          color: #A41E22;
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 6px;
        }

        .cookie-description {
          color: #e0e0e0;
          font-size: 14px;
          line-height: 1.5;
        }

        .cookie-link {
          color: #A41E22;
          text-decoration: underline;
        }

        .cookie-buttons {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        .cookie-btn {
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .cookie-btn-accept {
          background: linear-gradient(135deg, #A41E22 0%, #6C1312 100%);
          color: white;
        }

        .cookie-btn-accept:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(164, 30, 34, 0.4);
        }

        .cookie-btn-decline {
          background: transparent;
          color: #e0e0e0;
          border: 1px solid #666;
        }

        .cookie-btn-decline:hover {
          border-color: #A41E22;
          color: #A41E22;
        }

        @media (max-width: 640px) {
          .cookie-content {
            flex-direction: column;
            text-align: center;
          }

          .cookie-buttons {
            width: 100%;
            justify-content: center;
          }

          .close-btn {
            top: -45px;
            right: 50%;
            transform: translateX(50%);
          }
        }
      `}</style>

      <div className={`cookie-overlay ${isVisible ? 'visible' : ''}`} />
      
      <div className={`cookie-consent ${isVisible ? 'visible' : ''}`}>
        <div className="cookie-content">
          <button 
            onClick={handleClose}
            className="close-btn"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div className="cookie-text">
            <div className="cookie-title">
              {locale === "bn" ? "কুকি নীতি" : "Cookie Policy"}
            </div>
            <p className="cookie-description">
              {locale === "bn" 
                ? "আমরা আপনার ব্রাউজিং অভিজ্ঞতা উন্নত করতে কুকি ব্যবহার করি। আমাদের গোপনীয়তা নীতি পড়ুন "
                : "We use cookies to improve your browsing experience. Read our "}
              <Link href={`/${locale}/privacy`} className="cookie-link">
                {locale === "bn" ? "গোপনীয়তা নীতি" : "Privacy Policy"}
              </Link>
              {locale === "bn" ? "।" : "."}
            </p>
          </div>
          <div className="cookie-buttons">
            <button 
              onClick={handleDecline}
              className="cookie-btn cookie-btn-decline"
            >
              {locale === "bn" ? "অসম্মতি" : "Decline"}
            </button>
            <button 
              onClick={handleAccept}
              className="cookie-btn cookie-btn-accept"
            >
              {locale === "bn" ? "সম্মতি" : "Accept"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
