"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

type Comment = {
  id: number;
  author_name: string;
  author_email?: string;
  author_url?: string;
  date: string;
  content: { rendered: string };
  link?: string;
  author_avatar_urls?: {
    24: string;
    48: string;
    96: string;
  };
};

type CommentSectionProps = {
  postId: number;
  locale: string;
};

const CommentSection: React.FC<CommentSectionProps> = ({ postId, locale }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    website: "",
    comment: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.theeyepress.com";

  const labels = {
    title: locale === "bn" ? "মতামত" : "Comments",
    leaveComment: locale === "bn" ? "মতামত দিন" : "Leave a Comment",
    name: locale === "bn" ? "আপনার নাম" : "Your Name",
    email: locale === "bn" ? "ইমেইল ঠিকানা" : "Email Address",
    website: locale === "bn" ? "ওয়েবসাইট (ঐচ্ছিক)" : "Website (optional)",
    comment: locale === "bn" ? "আপনার মতামত" : "Your Comment",
    submit: locale === "bn" ? "জমা দিন" : "Submit",
    loading: locale === "bn" ? "লোড হচ্ছে..." : "Loading...",
    noComments: locale === "bn" ? "এখনো কোনো মতামত নেই। প্রথম মতামত দিন!" : "No comments yet. Be the first to comment!",
    reply: locale === "bn" ? "উত্তর দিন" : "Reply",
    replies: locale === "bn" ? "টি উত্তর" : "replies",
    loginRequired: locale === "bn" ? "মতামত দিতে লগইন করুন" : "Please login to comment",
    success: locale === "bn" ? "মতামত সফলভাবে জমা হয়েছে! অনুমোদনের অপেক্ষায়।" : "Comment submitted successfully! It will appear after approval.",
    nameRequired: locale === "bn" ? "নাম প্রয়োজন" : "Name is required",
    emailRequired: locale === "bn" ? "ইমেইল প্রয়োজন" : "Email is required",
    commentRequired: locale === "bn" ? "মতামত প্রয়োজন" : "Comment is required",
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("eyepress_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || "",
          email: parsed.email || "",
        }));
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/wp-json/wp/v2/comments?post=${postId}&per_page=50&order=desc`
        );
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError("Failed to load comments");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchComments();
    }
  }, [postId, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setSubmitError(labels.nameRequired);
      return;
    }
    if (!formData.email.trim()) {
      setSubmitError(labels.emailRequired);
      return;
    }
    if (!formData.comment.trim()) {
      setSubmitError(labels.commentRequired);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/wp-json/wp/v2/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post: postId,
          author_name: formData.name,
          author_email: formData.email,
          author_url: formData.website || undefined,
          content: formData.comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit comment");
      }

      setSuccessMessage(labels.success);
      setFormData({ name: user?.name || "", email: user?.email || "", website: "", comment: "" });
    } catch (err: any) {
      console.error("Error submitting comment:", err);
      setSubmitError(err.message || "Failed to submit comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === "bn") {
      const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const day = date.getDate().toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      const month = date.toLocaleString("bn-BD", { month: "short" });
      const year = date.getFullYear().toString().split("").map((n) => bnNums[parseInt(n)] || n).join("");
      return `${day} ${month}, ${year}`;
    }
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-[#A41E22]" />
        <h2 className="text-2xl font-bold text-[#6C1312]">
          {labels.title} ({comments.length})
        </h2>
      </div>

      {/* Comment Form */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{labels.leaveComment}</h3>
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comment-name" className="block text-sm font-medium text-gray-700 mb-1">
                {labels.name} *
              </label>
              <input
                id="comment-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition"
                placeholder={labels.name}
                required
              />
            </div>
            <div>
              <label htmlFor="comment-email" className="block text-sm font-medium text-gray-700 mb-1">
                {labels.email} *
              </label>
              <input
                id="comment-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition"
                placeholder={labels.email}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="comment-website" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.website}
            </label>
            <input
              id="comment-website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition"
              placeholder="https://"
            />
          </div>
          <div>
            <label htmlFor="comment-content" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.comment} *
            </label>
            <textarea
              id="comment-content"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A41E22] focus:border-transparent outline-none transition resize-none"
              placeholder={labels.comment}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-[#A41E22] text-white font-semibold rounded-lg hover:bg-[#8B1A1D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? labels.loading : labels.submit}
          </button>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">{labels.loading}</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{labels.noComments}</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {comment.author_avatar_urls && comment.author_avatar_urls[96] ? (
                  <Image
                    src={comment.author_avatar_urls[96]}
                    alt={comment.author_name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#A41E22] flex items-center justify-center text-white font-bold text-lg">
                    {comment.author_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{comment.author_name}</span>
                    <span className="text-sm text-gray-500">{formatDate(comment.date)}</span>
                  </div>
                  <div
                    className="text-gray-700 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: comment.content.rendered }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
