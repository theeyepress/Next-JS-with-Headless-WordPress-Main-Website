// src/components/VideoSlider.tsx
"use client";

import React, { useState } from "react";
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
};

const VideoSlider: React.FC<VideoSliderProps> = ({
  videos,
  locale = "bn",
  className = "",
}) => {
  const [currentVideo, setCurrentVideo] = useState<VideoPost | null>(null);

  const settings = {
    dots: false,
    infinite: true,
    speed: 300,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  const handleVideoClick = (video: VideoPost) => {
    if (video.type === "youtube") {
      window.open(video.watchUrl || `https://www.youtube.com/watch?v=${video.videoId}`, "_blank");
    } else if (video.type === "self-hosted" || video.type === "selfhosted") {
      setCurrentVideo(video);
    } else if (video.type === "post" && video.slug) {
      window.open(`/${locale}/${encodeURIComponent(video.slug)}`, "_self");
    }
  };

  const getThumbnail = (video: VideoPost) => {
    if (video.thumbnail) return video.thumbnail;
    if (video.featuredImage?.node?.sourceUrl) return video.featuredImage.node.sourceUrl;
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
    <div className={className}>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-2xl font-bold text-[#6C1312] flex items-center gap-2">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          {locale === "bn" ? "ভিডিও" : "Videos"}
        </h2>
      </div>

      <Slider {...settings}>
        {videos.map((video, index) => {
          const thumbnail = getThumbnail(video);
          const category = getCategory(video);

          return (
            <div key={index} className="px-1 md:px-2" style={{ height: '260px' }}>
              <div
                onClick={() => handleVideoClick(video)}
                className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all h-full flex flex-col cursor-pointer"
              >
                <div className="relative h-28 md:h-40 flex-shrink-0 overflow-hidden">
                  {thumbnail ? (
                    <>
                      <Image
                        src={thumbnail}
                        alt={getTitle(video)}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#A41E22] flex items-center justify-center">
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
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center">
                        {video.type === "youtube" ? (
                          <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        ) : video.type === "self-hosted" || video.type === "selfhosted" ? (
                          <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Type badge */}
                  <span className="absolute top-1.5 md:top-2 left-1.5 md:left-2 px-1.5 md:px-2 py-0.5 md:py-1 bg-[#A41E22] text-white text-xs font-bold uppercase rounded">
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

      {/* Video Player Modal for Self-hosted videos */}
      {currentVideo && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 md:p-4"
          onClick={() => setCurrentVideo(null)}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCurrentVideo(null)}
              className="absolute -top-10 right-0 text-white text-lg md:text-xl hover:text-red-500"
            >
              ✕ Close
            </button>
            <video
              src={currentVideo.url}
              controls
              autoPlay
              className="w-full rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
            {currentVideo.title && (
              <h3 className="text-white text-base md:text-lg mt-2">{currentVideo.title}</h3>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSlider;
