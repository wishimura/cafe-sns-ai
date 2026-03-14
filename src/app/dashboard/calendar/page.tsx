"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PostGeneration, ScheduledPost } from "@/types/database";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const DAY_HEADERS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const supabase = createClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [generations, setGenerations] = useState<PostGeneration[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);

  // Load shop ID on mount
  useEffect(() => {
    async function loadShop() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setShopId(data.id);
      }
    }
    loadShop();
  }, [supabase]);

  // Calculate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Load data for the visible month range
  const loadData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);

    const rangeStart = format(calendarStart, "yyyy-MM-dd");
    const rangeEnd = format(calendarEnd, "yyyy-MM-dd") + "T23:59:59";

    try {
      const [genResult, schedResult] = await Promise.all([
        supabase
          .from("post_generations")
          .select("*")
          .eq("shop_id", shopId)
          .gte("created_at", rangeStart)
          .lte("created_at", rangeEnd)
          .order("created_at", { ascending: false }),
        supabase
          .from("scheduled_posts")
          .select("*")
          .eq("shop_id", shopId)
          .gte("scheduled_at", rangeStart)
          .lte("scheduled_at", rangeEnd)
          .order("scheduled_at", { ascending: true }),
      ]);

      setGenerations(genResult.data || []);
      setScheduledPosts(schedResult.data || []);
    } catch {
      toast.error("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, currentMonth]);

  useEffect(() => {
    if (shopId) {
      loadData();
    }
  }, [shopId, loadData]);

  // Navigation
  const goToPrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Get posts for a specific day
  const getGenerationsForDay = (day: Date) =>
    generations.filter((g) => isSameDay(new Date(g.created_at), day));

  const getScheduledForDay = (day: Date) =>
    scheduledPosts.filter((s) => isSameDay(new Date(s.scheduled_at), day));

  // Cancel a scheduled post
  const handleCancelScheduled = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setScheduledPosts((prev) => prev.filter((s) => s.id !== id));
      toast.success("予約を取り消しました");
    } catch {
      toast.error("予約の取り消しに失敗しました");
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      posted: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      pending: "予約中",
      posted: "投稿済み",
      failed: "失敗",
    };
    return (
      <span
        className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium",
          styles[status] || "bg-gray-100 text-gray-600"
        )}
      >
        {labels[status] || status}
      </span>
    );
  };

  // Platform labels
  const platformLabels: Record<string, string> = {
    all: "すべて",
    instagram: "Instagram",
    story: "ストーリー",
    line: "LINE",
  };

  // Selected day data
  const selectedGenerations = selectedDate
    ? getGenerationsForDay(selectedDate)
    : [];
  const selectedScheduled = selectedDate
    ? getScheduledForDay(selectedDate)
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-bold">カレンダー</h1>
      </div>

      {/* Calendar card */}
      <div className="card">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="前月"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">
              {format(currentMonth, "yyyy年M月", { locale: ja })}
            </h2>
            <button
              onClick={goToToday}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium px-2 py-1 hover:bg-brand-50 rounded transition-colors"
            >
              今日
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="翌月"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        )}

        {!loading && (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {DAY_HEADERS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    "text-center text-xs font-medium py-2",
                    i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px">
              {calendarDays.map((day) => {
                const dayGenerations = getGenerationsForDay(day);
                const dayScheduled = getScheduledForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const isSelected =
                  selectedDate && isSameDay(day, selectedDate);
                const dayOfWeek = day.getDay();

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "relative min-h-[60px] sm:min-h-[72px] p-1 sm:p-2 text-left border border-gray-100 rounded-md transition-colors",
                      isCurrentMonth
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-50/50",
                      isTodayDate && "bg-brand-50",
                      isSelected && "ring-2 ring-brand-500"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-medium",
                        !isCurrentMonth && "text-gray-300",
                        isCurrentMonth && dayOfWeek === 0 && "text-red-500",
                        isCurrentMonth && dayOfWeek === 6 && "text-blue-500",
                        isCurrentMonth &&
                          dayOfWeek !== 0 &&
                          dayOfWeek !== 6 &&
                          "text-gray-700",
                        isTodayDate &&
                          "bg-brand-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Dots */}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {dayGenerations.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                      )}
                      {dayScheduled.some((s) => s.status === "pending") && (
                        <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                      )}
                      {dayScheduled.some((s) => s.status === "posted") && (
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      )}
                      {dayScheduled.some((s) => s.status === "failed") && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                生成済み
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                予約中
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                投稿済み
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                失敗
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail panel */}
      {selectedDate && (
        <div className="card mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {format(selectedDate, "M月d日（E）", { locale: ja })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Generated posts */}
          {selectedGenerations.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">
                生成した投稿（{selectedGenerations.length}件）
              </h4>
              <div className="space-y-3">
                {selectedGenerations.map((gen) => (
                  <div
                    key={gen.id}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-brand-600">
                        {gen.theme}
                      </span>
                      <span className="text-xs text-gray-400">
                        {platformLabels[gen.platform] || gen.platform}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {gen.output_1}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(gen.created_at), "HH:mm")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled posts */}
          {selectedScheduled.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">
                予約投稿（{selectedScheduled.length}件）
              </h4>
              <div className="space-y-3">
                {selectedScheduled.map((sched) => {
                  const previewText =
                    sched.post_content?.instagram_posts?.[0]?.text ||
                    sched.post_content?.story_text ||
                    sched.post_content?.line_text ||
                    "";
                  const truncated =
                    previewText.length > 80
                      ? previewText.slice(0, 80) + "..."
                      : previewText;

                  return (
                    <div
                      key={sched.id}
                      className="bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {format(new Date(sched.scheduled_at), "HH:mm")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {platformLabels[sched.platform] || sched.platform}
                          </span>
                          <StatusBadge status={sched.status} />
                        </div>
                        {sched.status === "pending" && (
                          <button
                            onClick={() => handleCancelScheduled(sched.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            取り消す
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {truncated}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {selectedGenerations.length === 0 &&
            selectedScheduled.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                この日のデータはありません
              </p>
            )}
        </div>
      )}
    </div>
  );
}
