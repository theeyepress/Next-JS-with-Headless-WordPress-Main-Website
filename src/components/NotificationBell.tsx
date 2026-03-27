"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Notification = {
  id: number;
  email: string;
  comment_id: number;
  post_id: number;
  post_slug: string;
  post_title: string;
  status: string;
  notification_read: number;
  created_at: string;
};

type NotificationBellProps = {
  locale: string;
};

const NotificationBell: React.FC<NotificationBellProps> = ({ locale }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.theeyepress.com";

  const labels = {
    title: locale === "bn" ? "নোটিফিকেশন" : "Notifications",
    empty: locale === "bn" ? "কোনো নোটিফিকেশন নেই" : "No notifications",
    approved: locale === "bn" ? "আপনার মতামত অনুমোদিত হয়েছে" : "Your comment has been approved",
    spam: locale === "bn" ? "আপনার মতামত স্প্যাম হিসেবে চিহ্নিত" : "Your comment was marked as spam",
    trash: locale === "bn" ? "আপনার মতামত বাতিল হয়েছে" : "Your comment was removed",
    pending: locale === "bn" ? "আপনার মতামত অনুমোদনের অপেক্ষায়" : "Your comment is pending approval",
    markRead: locale === "bn" ? "সব পড়া হয়েছে" : "Mark all as read",
    viewPost: locale === "bn" ? "পোস্ট দেখুন" : "View post",
  };

  useEffect(() => {
    // Try both wp_user and eyepress_user for backward compatibility
    const storedUser = localStorage.getItem("wp_user") || localStorage.getItem("eyepress_user");
    console.log("Stored user:", storedUser);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        console.log("Parsed user:", parsed);
        const email = parsed.email;
        console.log("User email:", email);
        if (email) {
          setUserEmail(email);
          // Sync first, then fetch (wait for sync to complete)
          syncNotifications(email).then((synced) => {
            console.log("Sync completed, synced:", synced);
            // Add small delay to ensure database commit
            setTimeout(() => {
              fetchNotifications(email);
            }, 500);
          });
        }
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for new notifications every 5 seconds
  useEffect(() => {
    if (!userEmail) return;
    
    const interval = setInterval(() => {
      // Sync first, then fetch (wait for sync to complete)
      syncNotifications(userEmail).then((synced) => {
        console.log("Interval sync completed, synced:", synced);
        if (!synced) {
          // Only fetch if nothing was synced
          fetchNotifications(userEmail);
        }
      });
    }, 5000); // 5 seconds
    
    return () => clearInterval(interval);
  }, [userEmail]);

  // Also refresh when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && userEmail) {
        fetchNotifications(userEmail);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [userEmail]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async (email: string) => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      console.log("Fetching notifications for:", email);
      const response = await fetch(
        `${API_URL}/wp-json/eyepress/v1/notifications?email=${encodeURIComponent(email)}`
      );
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Notifications response:", data);
      
      if (!response.ok) {
        setError(data.message || "Failed to fetch notifications");
      } else if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } else {
        setError(data.message || "Unknown error");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Sync existing comments to notifications table
  const syncNotifications = async (email: string) => {
    if (!email) return false;
    try {
      console.log("Syncing notifications for:", email);
      const response = await fetch(`${API_URL}/wp-json/eyepress/v1/notifications/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      console.log("Sync response:", data);
      console.log("Total found:", data.total_found, "Synced:", data.synced);
      
      // If synced, directly use the synced notifications instead of fetching again
      if (data.synced > 0 && data.notifications) {
        console.log("Using synced notifications directly");
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications.filter((n: any) => !n.notification_read).length || 0);
        return true;
      }
      
      return data.synced > 0; // Return true if synced something
    } catch (err) {
      console.error("Error syncing notifications:", err);
      return false;
    }
  };

  const markAllAsRead = async () => {
    // Try both wp_user and eyepress_user for backward compatibility
    const storedUser = localStorage.getItem("wp_user") || localStorage.getItem("eyepress_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email) {
          await fetch(`${API_URL}/wp-json/eyepress/v1/notifications/mark-read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: parsed.email }),
          });
          setUnreadCount(0);
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, notification_read: 1 }))
          );
        }
      } catch (err) {
        console.error("Error marking as read:", err);
      }
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "1":
      case "approved":
        return labels.approved;
      case "spam":
        return labels.spam;
      case "trash":
        return labels.trash;
      default:
        return labels.pending;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "1":
      case "approved":
        return "bg-green-100 text-green-700";
      case "spam":
        return "bg-red-100 text-red-700";
      case "trash":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return locale === "bn" ? "এখন" : "Just now";
    if (diffMins < 60)
      return locale === "bn"
        ? `${diffMins} মিনিট আগে`
        : `${diffMins}m ago`;
    if (diffHours < 24)
      return locale === "bn"
        ? `${diffHours} ঘণ্টা আগে`
        : `${diffHours}h ago`;
    if (diffDays < 7)
      return locale === "bn"
        ? `${diffDays} দিন আগে`
        : `${diffDays}d ago`;

    if (locale === "bn") {
      const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const day = date.getDate().toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      const month = date.toLocaleString("bn-BD", { month: "short" });
      return `${day} ${month}`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && userEmail) {
            // Refresh notifications when opening modal
            syncNotifications(userEmail).then((synced) => {
              if (!synced) {
                fetchNotifications(userEmail);
              }
            });
          }
        }}
        className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full text-[#A41E22] font-semibold text-sm transition-all cursor-pointer hover:bg-gray-100"
        title={labels.title}
      >
        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full red-dot-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 md:right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-lg shadow-xl bg-white border border-gray-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900 text-sm">{labels.title}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#A41E22] hover:underline font-medium"
              >
                {labels.markRead}
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {locale === "bn" ? "লোড হচ্ছে..." : "Loading..."}
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500 text-sm">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {userEmail ? labels.empty : (locale === "bn" ? "লগইন করুন" : "Please login")}
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={`/${locale}/${notification.post_slug || notification.post_id}`}
                  className={`block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !notification.notification_read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                        !notification.notification_read ? "bg-[#A41E22]" : "bg-gray-300"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate">
                        {notification.post_title}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {getStatusMessage(notification.status)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                            notification.status
                          )}`}
                        >
                          {notification.status === "1" || notification.status === "approved"
                            ? locale === "bn"
                              ? "অনুমোদিত"
                              : "Approved"
                            : notification.status === "spam"
                            ? "Spam"
                            : notification.status === "trash"
                            ? "Trash"
                            : locale === "bn"
                            ? "অপেক্ষায়"
                            : "Pending"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
