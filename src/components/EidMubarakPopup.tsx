// src/components/EidMubarakPopup.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

type EidMubarakPopupProps = {
  locale?: string;
};

const MAX_SHOWS = 3;

const EidMubarakPopup: React.FC<EidMubarakPopupProps> = ({ locale = "bn" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const storageKey = "eidMubarakPopup2026";
    const shownCount = parseInt(localStorage.getItem(storageKey) || "0", 10);
    
    if (shownCount >= MAX_SHOWS) {
      setIsHidden(true);
      return;
    }

    const nextShow = shownCount + 1;
    
    const delays = [5000, 15000, 30000];
    const delay = delays[Math.min(nextShow - 1, delays.length - 1)];
    
    const timer = setTimeout(() => {
      setIsVisible(true);
      setAnimationPhase('visible');
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible && audioRef.current && !isMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [isVisible, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isVisible || isMuted) return;

    const handleEnded = () => {
      setAnimationPhase('exiting');
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setIsHidden(true), 300);
      }, 500);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [isVisible, isMuted]);

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    const storageKey = "eidMubarakPopup2026";
    const currentCount = parseInt(localStorage.getItem(storageKey) || "0", 10);
    const newCount = currentCount + 1;
    
    localStorage.setItem(storageKey, newCount.toString());
    
    setAnimationPhase('exiting');
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setIsHidden(true), 300);
    }, 500);
  };

  if (isHidden) return null;

  const isBengali = locale === "bn";

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes starBurst {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1) rotate(180deg); opacity: 0; }
        }

        @keyframes moonGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1); }
          50% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.5), 0 0 100px rgba(255, 215, 0, 0.2); }
        }

        @keyframes slideUp {
          0% { transform: translateY(100px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        @keyframes crescentBounce {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }

        @keyframes textShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }

        .eid-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 40, 0.85) 100%);
          backdrop-filter: blur(10px);
          z-index: 99997;
          opacity: 0;
          visibility: hidden;
          transition: all 0.5s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .eid-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        .eid-overlay.exiting {
          opacity: 0;
        }

        .eid-popup {
          position: relative;
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
          border-radius: 24px;
          padding: 40px 30px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          overflow: hidden;
          opacity: 0;
          transform: translateY(50px) scale(0.9);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(255, 215, 0, 0.3);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 100px rgba(255, 215, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .eid-popup.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .eid-popup.exiting {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }

        .eid-popup::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 40%,
            rgba(255, 215, 0, 0.03) 50%,
            transparent 60%
          );
          animation: shimmer 3s ease-in-out infinite;
          pointer-events: none;
        }

        .stars-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .star {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #ffd700;
          border-radius: 50%;
          animation: sparkle 2s ease-in-out infinite;
        }

        .star:nth-child(1) { top: 10%; left: 15%; animation-delay: 0s; }
        .star:nth-child(2) { top: 20%; right: 20%; animation-delay: 0.3s; width: 3px; height: 3px; }
        .star:nth-child(3) { top: 30%; left: 10%; animation-delay: 0.6s; }
        .star:nth-child(4) { top: 15%; right: 10%; animation-delay: 0.9s; width: 5px; height: 5px; }
        .star:nth-child(5) { top: 40%; right: 15%; animation-delay: 1.2s; }
        .star:nth-child(6) { top: 5%; left: 30%; animation-delay: 1.5s; width: 3px; height: 3px; }
        .star:nth-child(7) { top: 25%; left: 25%; animation-delay: 0.2s; }
        .star:nth-child(8) { top: 35%; right: 25%; animation-delay: 0.8s; width: 6px; height: 6px; }

        .moon-container {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
          animation: moonGlow 3s ease-in-out infinite;
        }

        .moon {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #ffd700 0%, #ffec8b 50%, #ffd700 100%);
          border-radius: 50%;
          position: relative;
          animation: pulse 3s ease-in-out infinite;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
        }

        .moon::before {
          content: '';
          position: absolute;
          top: 10%;
          right: -15%;
          width: 85%;
          height: 85%;
          background: #1a1a2e;
          border-radius: 50%;
        }

        .moon-face {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px;
        }

        .lantern-left, .lantern-right {
          position: absolute;
          top: -20px;
          width: 30px;
          height: 50px;
          animation: crescentBounce 2s ease-in-out infinite;
        }

        .lantern-left { left: 10%; animation-delay: 0s; }
        .lantern-right { right: 10%; animation-delay: 0.5s; }

        .lantern {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .lantern-body {
          width: 100%;
          height: 70%;
          background: linear-gradient(180deg, #ff6b6b 0%, #ee5a5a 50%, #d94444 100%);
          border-radius: 8px 8px 50% 50%;
          position: relative;
          overflow: hidden;
        }

        .lantern-body::before {
          content: '';
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          height: 10px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          border-radius: 4px;
        }

        .lantern-top {
          width: 60%;
          height: 8px;
          background: linear-gradient(90deg, #ffd700, #ffec8b, #ffd700);
          margin: 0 auto;
          border-radius: 4px;
        }

        .lantern-string {
          width: 2px;
          height: 15px;
          background: #ffd700;
          margin: 0 auto;
        }

        .lantern-bottom {
          width: 30%;
          height: 15px;
          background: linear-gradient(90deg, #ffd700, #ffec8b, #ffd700);
          margin: 0 auto;
          border-radius: 0 0 4px 4px;
          animation: float 2s ease-in-out infinite;
        }

        .eid-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(
            90deg,
            #ffd700 0%,
            #ffec8b 25%,
            #ffd700 50%,
            #ffec8b 75%,
            #ffd700 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textShimmer 3s linear infinite;
        }

        .eid-subtitle {
          font-size: 1.1rem;
          color: #b8b8d0;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .eid-message {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          position: relative;
        }

        .eid-message::before,
        .eid-message::after {
          content: '✦';
          position: absolute;
          color: #ffd700;
          font-size: 1.2rem;
          opacity: 0.6;
        }

        .eid-message::before { top: -10px; left: 20px; }
        .eid-message::after { bottom: -10px; right: 20px; }

        .eid-message-text {
          color: #e8e8f0;
          font-size: 1rem;
          line-height: 1.8;
        }

        .eid-message-text strong {
          color: #ffd700;
          font-weight: 600;
        }

        .decorative-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 20px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent);
        }

        .divider-star {
          color: #ffd700;
          font-size: 0.8rem;
        }

        .eid-wishes {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .wish-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #c0c0d0;
          font-size: 0.9rem;
        }

        .wish-icon {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffd700;
          font-size: 0.7rem;
        }

        .eid-button {
          background: linear-gradient(135deg, #ffd700 0%, #ffb347 50%, #ffd700 100%);
          background-size: 200% auto;
          color: #1a1a2e;
          border: none;
          padding: 14px 40px;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .eid-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.5s ease;
        }

        .eid-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
          background-position: right center;
        }

        .eid-button:hover::before {
          left: 100%;
        }

        .eid-button:active {
          transform: translateY(0);
        }

        .crescent-decoration {
          position: absolute;
          font-size: 2rem;
          opacity: 0.1;
          color: #ffd700;
        }

        .crescent-1 { top: 20px; right: 20px; }
        .crescent-2 { bottom: 60px; left: 20px; }

        .audio-toggle {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 215, 0, 0.3);
          background: rgba(255, 215, 0, 0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .audio-toggle:hover {
          background: rgba(255, 215, 0, 0.2);
          transform: scale(1.1);
        }

        .audio-toggle svg {
          width: 18px;
          height: 18px;
          color: #ffd700;
        }

        .audio-wave {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 14px;
        }

        .audio-wave span {
          width: 3px;
          background: #ffd700;
          border-radius: 2px;
          animation: wave 0.8s ease-in-out infinite;
        }

        .audio-wave span:nth-child(1) { height: 6px; animation-delay: 0s; }
        .audio-wave span:nth-child(2) { height: 10px; animation-delay: 0.1s; }
        .audio-wave span:nth-child(3) { height: 14px; animation-delay: 0.2s; }
        .audio-wave span:nth-child(4) { height: 10px; animation-delay: 0.3s; }

        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }

        .audio-muted .audio-wave span {
          animation: none;
          height: 3px;
        }

        @media (max-width: 640px) {
          .eid-popup {
            padding: 30px 20px;
            border-radius: 20px;
            margin: 10px;
          }

          .eid-title {
            font-size: 1.6rem;
          }

          .eid-subtitle {
            font-size: 0.95rem;
          }

          .eid-message {
            padding: 16px;
          }

          .eid-message-text {
            font-size: 0.9rem;
          }

          .moon-container {
            width: 80px;
            height: 80px;
          }

          .moon-face {
            font-size: 20px;
          }

          .lantern-left, .lantern-right {
            width: 24px;
            height: 40px;
          }

          .eid-button {
            padding: 12px 32px;
            font-size: 0.95rem;
          }

          .eid-wishes {
            gap: 12px;
          }

          .wish-item {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 380px) {
          .eid-title {
            font-size: 1.4rem;
          }

          .eid-message-text {
            font-size: 0.85rem;
          }
        }
      `}</style>

      <div 
        className={`eid-overlay ${isVisible ? 'visible' : ''} ${animationPhase === 'exiting' ? 'exiting' : ''}`}
        onClick={handleClose}
      >
        <div 
          className={`eid-popup ${isVisible ? 'visible' : ''} ${animationPhase === 'exiting' ? 'exiting' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <audio
            ref={audioRef}
            src="/audio/eid-mubarak.mp3"
            preload="auto"
          />
          
          <button 
            className={`audio-toggle ${isMuted ? 'audio-muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            ) : (
              <div className="audio-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </button>

          <div className="stars-container">
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
          </div>

          <div className="crescent-decoration crescent-1">☪</div>
          <div className="crescent-decoration crescent-2">☪</div>

          <div className="lantern-left">
            <div className="lantern">
              <div className="lantern-string"></div>
              <div className="lantern-top"></div>
              <div className="lantern-body"></div>
              <div className="lantern-bottom"></div>
            </div>
          </div>

          <div className="lantern-right">
            <div className="lantern">
              <div className="lantern-string"></div>
              <div className="lantern-top"></div>
              <div className="lantern-body"></div>
              <div className="lantern-bottom"></div>
            </div>
          </div>

          <div className="moon-container">
            <div className="moon">
              <span className="moon-face">🌙</span>
            </div>
          </div>

          <h2 className="eid-title">
            {isBengali ? "ঈদ মুবারক" : "Eid Mubarak"}
          </h2>

          <p className="eid-subtitle">
            {isBengali 
              ? "আল্লাহ আপনাকে সুস্থতা, সমৃদ্ধি ও শান্তি দান করুন" 
              : "May Allah grant you health, prosperity, and peace"}
          </p>

          <div className="decorative-divider">
            <div className="divider-line"></div>
            <span className="divider-star">✦</span>
            <div className="divider-line"></div>
          </div>

          <div className="eid-message">
            <p className="eid-message-text">
              {isBengali ? (
                <>
                  <strong>২০২৬</strong> সালের পবিত্র ঈদ-উল-ফিতর উপলক্ষে <br />
                  <strong>The EyePress</strong> পরিবারের পক্ষ থেকে <br />
                  আপনাকে ও আপনার পরিবারকে <strong>ঈদের অনেক শুভেচ্ছা!</strong> 🎉
                </>
              ) : (
                <>
                  Wishing you and your family a <strong>joyous Eid-ul-Fitr</strong><br />
                  from the <strong>The EyePress</strong> family!<br />
                  May this special day bring you <strong>happiness and peace</strong> 🎉
                </>
              )}
            </p>
          </div>

          <div className="eid-wishes">
            <div className="wish-item">
              <span className="wish-icon">🤲</span>
              <span>{isBengali ? "দোয়া" : "Prayers"}</span>
            </div>
            <div className="wish-item">
              <span className="wish-icon">❤️</span>
              <span>{isBengali ? "ভালোবাসা" : "Love"}</span>
            </div>
            <div className="wish-item">
              <span className="wish-icon">🌟</span>
              <span>{isBengali ? "সমৃদ্ধি" : "Prosperity"}</span>
            </div>
          </div>

          <button onClick={handleClose} className="eid-button">
            {isBengali ? "ঈদ মুবারক! 🎊" : "Eid Mubarak! 🎊"}
          </button>
        </div>
      </div>
    </>
  );
};

export default EidMubarakPopup;
