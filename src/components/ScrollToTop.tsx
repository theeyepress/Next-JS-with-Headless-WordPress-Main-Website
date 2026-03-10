// src/components/ScrollToTop.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const ScrollToTop: React.FC = () => {
  const [isScrollVisible, setIsScrollVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsScrollVisible(true);
      } else {
        setIsScrollVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <style jsx>{`
        .floating-buttons {
          position: fixed;
          bottom: 30px;
          right: 30px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          z-index: 9999;
        }

        .ai-assistant-btn {
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #A41E22;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 25px rgba(164, 30, 34, 0.4), 0 0 50px rgba(164, 30, 34, 0.2);
          animation: pulse-glow 2s ease-in-out infinite, float 3s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .ai-assistant-btn:hover {
          transform: scale(1.15);
          box-shadow: 0 0 35px rgba(164, 30, 34, 0.6), 0 0 60px rgba(164, 30, 34, 0.35);
          animation: none;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(164, 30, 34, 0.4), 0 0 40px rgba(164, 30, 34, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(164, 30, 34, 0.6), 0 0 50px rgba(164, 30, 34, 0.35);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .scroll-to-top {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #A41E22 0%, #6C1312 100%);
          border: 2px solid #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(164, 30, 34, 0.4);
          animation: float 3s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .scroll-to-top:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(164, 30, 34, 0.6);
          animation: none;
        }

        .scroll-to-top:active {
          transform: scale(0.95);
        }

        @keyframes scroll-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>

      <div className="floating-buttons">
        {/* AI Assistant CTA Button - Always Visible */}
        <Link 
          href="https://wa.me/8801761622666?text=Hello! I have a query about news/incidents. Can you help me?"
          className="ai-assistant-btn"
          aria-label="Contact AI Assistant"
          title="Chat with us - 24/7 AI Helper for news queries"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg 
            width="36" 
            height="36" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            {/* WhatsApp-style chat bubble */}
            <path 
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 8.38 8.38 8.38 0 0 1-3.8-.9l-5.4 1.4 1.4-5.4a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" 
              stroke="#A41E22" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none"
            />
            {/* Chat lines inside */}
            <path d="M7 9h3.5" stroke="#A41E22" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M7 12h2.5" stroke="#A41E22" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Link>

        {/* Scroll to Top Button - Visible on Scroll */}
        {isScrollVisible && (
          <button
            onClick={scrollToTop}
            className="scroll-to-top"
            aria-label="Scroll to top"
            title="Scroll to top"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};

export default ScrollToTop;
