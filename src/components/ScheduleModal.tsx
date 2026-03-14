"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: {
    instagram_posts: { text: string }[];
    story_text: string;
    line_text: string;
    hashtags: string;
  };
  platform: string;
  photoUrl: string | null;
  shopId: string;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  postContent,
  platform,
  photoUrl,
  shopId,
}: ScheduleModalProps) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      // Set default to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      defaultTime.setMinutes(0, 0, 0);
      setScheduledAt(format(defaultTime, "yyyy-MM-dd'T'HH:mm"));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minDateTime = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const platformLabels: Record<string, string> = {
    all: "すべて",
    instagram: "Instagram",
    story: "ストーリー",
    line: "LINE",
  };

  const previewText =
    postContent.instagram_posts?.[0]?.text ||
    postContent.story_text ||
    postContent.line_text ||
    "";
  const truncatedPreview =
    previewText.length > 100 ? previewText.slice(0, 100) + "..." : previewText;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("scheduled_posts").insert({
        shop_id: shopId,
        post_content: postContent,
        scheduled_at: new Date(scheduledAt).toISOString(),
        platform,
        status: "pending",
        photo_url: photoUrl,
      });

      if (error) throw error;

      toast.success("投稿を予約しました");
      onClose();
    } catch {
      toast.error("予約に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="card w-full max-w-md mx-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarPlus className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold">投稿を予約</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Date/Time picker */}
          <div className="mb-4">
            <label className="label">予約日時</label>
            <input
              ref={inputRef}
              type="datetime-local"
              className="input-field"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDateTime}
              required
              disabled={saving}
            />
          </div>

          {/* Platform display */}
          <div className="mb-4">
            <label className="label">投稿媒体</label>
            <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-700">
              {platformLabels[platform] || platform}
            </div>
          </div>

          {/* Content preview */}
          <div className="mb-6">
            <label className="label">投稿内容プレビュー</label>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 leading-relaxed">
              {truncatedPreview}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={saving || !scheduledAt}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  予約中...
                </>
              ) : (
                <>
                  <CalendarPlus className="w-4 h-4" />
                  予約する
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
