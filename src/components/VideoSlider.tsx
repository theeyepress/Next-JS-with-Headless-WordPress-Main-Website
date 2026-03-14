// src/components/VideoSlider.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

type VideoPost = {
  type: "youtube" | "self-hosted" | "selfhosted" | "post";
  videoId?: string;
  url?: string;
  title: string;
  thumbnail?: string;
  embedUrl?: string;
  watchUrl?: string;
  slug?: string;
  excerpt?: string;
  date?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  categories?: {
    nodes: Array<{
      name: string;
      slug: string;
    }>;
  };
};

type VideoSliderProps = {
  videos: VideoPost[];
  locale?: string;
  className?: string;
  currentVideo?: VideoPost | null;
  onVideoClose?: () => void;
  onVideoClick?: (video: VideoPost) => void;
};

const VideoSlider: React.FC<VideoSliderProps> = ({
  videos,
  locale = "bn",
  className = "",
  currentVideo: externalCurrentVideo,
  onVideoClose,
  onVideoClick,
}) => {
  console.log("VideoSlider received videos:", videos);
  const [internalCurrentVideo, setInternalCurrentVideo] = useState<VideoPost | null>(null);
  const currentVideo = externalCurrentVideo ?? internalCurrentVideo;
  const setCurrentVideo = externalCurrentVideo !== undefined 
    ? (() => {}) 
    : setInternalCurrentVideo;
  const sliderRef = React.useRef<Slider>(null);

  const hasVideos = videos && videos.length > 0;
  const hasMultipleVideos = videos && videos.length > 1;

  const settings = {
    dots: false,
    infinite: hasMultipleVideos,
    speed: 500,
    slidesToShow: Math.min(4, videos?.length || 1),
    slidesToScroll: 1,
    autoplay: hasVideos,
    autoplaySpeed: 3500,
    swipe: true,
    swipeToSlide: true,
    touchMove: true,
    arrows: hasMultipleVideos,
    pauseOnHover: true,
    pauseOnDotsHover: true,
    prevArrow: <button className="slick-prev" aria-label="Previous">‹</button>,
    nextArrow: <button className="slick-next" aria-label="Next">›</button>,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: Math.min(3, videos?.length || 1) } },
      { breakpoint: 768, settings: { slidesToShow: Math.min(2, videos?.length || 1), swipe: true, draggable: true } },
      { breakpoint: 480, settings: { slidesToShow: 1, swipe: true, draggable: true } },
    ],
  };

  const handleVideoClick = (video: VideoPost) => {
    // If external onVideoClick is provided, use it
    if (onVideoClick) {
      onVideoClick(video);
      return;
    }
    
    // Otherwise use internal state
    if (video.type === "youtube") {
      window.open(video.watchUrl || `https://www.youtube.com/watch?v=${video.videoId}`, "_blank");
    } else if (video.type === "self-hosted" || video.type === "selfhosted") {
      // Self-hosted videos play in modal
      setInternalCurrentVideo(video);
    } else if (video.type === "post") {
      // Post-based videos - check if has embed URL, otherwise open post
      if (video.embedUrl || video.url) {
        setInternalCurrentVideo(video);
      } else if (video.slug) {
        window.open(`/${locale}/${encodeURIComponent(video.slug)}`, "_self");
      }
    }
  };

  const getThumbnail = (video: VideoPost) => {
    // If explicit thumbnail provided, use it
    if (video.thumbnail) return video.thumbnail;
    // If featured image from WordPress, use it
    if (video.featuredImage?.node?.sourceUrl) return video.featuredImage.node.sourceUrl;
    // For YouTube videos, generate thumbnail from videoId
    if (video.type === "youtube" && video.videoId) {
      return `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
    }
    // Return null - will show placeholder div
    return null;
  };
  
  const getPlaceholderBg = (video: VideoPost) => {
    // Different gradient based on video type
    if (video.type === "youtube") {
      return "linear-gradient(135deg, #ff0000 0%, #cc0000 100%)"; // YouTube red
    } else if (video.type === "self-hosted" || video.type === "selfhosted") {
      return "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)"; // Blue
    } else {
      return "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)"; // Green for posts
    }
  };

  const getTitle = (video: VideoPost) => {
    // Always use locale to determine the title - don't trust API cache
    if (locale === "bn") {
      return video.title || "ভিডিও";
    } else {
      return video.title || "Video";
    }
  };

  const getCategory = (video: VideoPost) => {
    return video.categories?.nodes?.[0]?.name;
  };

  return (
    <div className={`${className} my-4 md:my-6`}>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#6C1312] flex items-center gap-2">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          {locale === "bn" ? "ভিডিও" : "Videos"}
        </h2>
      </div>

      <Slider 
        ref={sliderRef} 
        {...settings}
        className={videos.length <= 1 ? "video-slider-single" : ""}
      >
        {videos.map((video, index) => {
          const thumbnail = getThumbnail(video);
          const category = getCategory(video);

          return (
            <div key={index} className="px-1 md:px-2" style={{ height: '280px' }}>
              <div
                onClick={() => handleVideoClick(video)}
                className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all h-full flex flex-col cursor-pointer"
              >
                <div className="relative h-32 md:h-40 flex-shrink-0 overflow-hidden">
                  {thumbnail ? (
                    <>
                      <Image
                        src={thumbnail}
                        alt={getTitle(video)}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Play button overlay - always visible */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#A41E22] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          {video.type === "youtube" ? (
                            <svg className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          ) : video.type === "self-hosted" || video.type === "selfhosted" ? (
                            <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Show placeholder with gradient when no thumbnail
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: getPlaceholderBg(video) }}
                    >
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        {video.type === "youtube" ? (
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        ) : video.type === "self-hosted" || video.type === "selfhosted" ? (
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Type badge */}
                  <span className="absolute top-2 left-2 px-2 py-1 bg-[#A41E22] text-white text-xs font-bold uppercase rounded">
                    {video.type === "youtube" 
                      ? (locale === "bn" ? "লাইভ" : "LIVE")
                      : (locale === "bn" ? "ট্রেন্ডিং" : "TRENDING")
                    }
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </Slider>

      {/* Video Player Modal for Self-hosted and Post videos - Only show if no external props */}
      {!externalCurrentVideo && internalCurrentVideo && (
        <>
          {/* Background fade overlay with blur - covers entire page */}
          <div 
            className="fixed inset-0 z-[9980] bg-black/60 backdrop-blur-md"
            onClick={() => onVideoClose ? onVideoClose() : setInternalCurrentVideo(null)}
          />
          {/* Video modal - below header, above content */}
          <div className="fixed inset-x-0 top-[100px] bottom-[80px] z-[9981] flex items-center justify-center p-4 md:p-8 overflow-hidden">
            <div 
              className="relative w-full max-w-5xl h-full max-h-[80vh] bg-black rounded-xl overflow-hidden shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => onVideoClose ? onVideoClose() : setInternalCurrentVideo(null)}
                className="absolute top-3 right-3 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all backdrop-blur-sm"
              >
                ✕
              </button>
              
              {/* Video player */}
              <div className="w-full h-full bg-black flex items-center justify-center">
                <video
                  src={internalCurrentVideo.url || internalCurrentVideo.embedUrl}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[70vh] object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              
              {/* Video info */}
              {internalCurrentVideo.title && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <h3 className="text-white text-lg md:text-xl font-bold">{internalCurrentVideo.title}</h3>
                  {internalCurrentVideo.excerpt && (
                    <p className="text-gray-300 mt-1 text-sm md:text-base line-clamp-2">{internalCurrentVideo.excerpt}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoSlider;
