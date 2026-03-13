"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PostGeneration, ReviewReply } from "@/types/database";
import {
  Clock,
  PenSquare,
  MessageSquare,
  Copy,
  Check,
  Star as StarIcon,
  Heart,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type TabType = "posts" | "reviews";

export default function HistoryPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<PostGeneration[]>([]);
  const [reviews, setReviews] = useState<ReviewReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shops } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id);

      if (!shops?.length) {
        setLoading(false);
        return;
      }

      const shopIds = shops.map((s) => s.id);

      const [postsRes, reviewsRes] = await Promise.all([
        supabase
          .from("post_generations")
          .select("*")
          .in("shop_id", shopIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("review_replies")
          .select("*")
          .in("shop_id", shopIds)
          .order("created_at", { ascending: false }),
      ]);

      setPosts(postsRes.data || []);
      setReviews(reviewsRes.data || []);
      setLoading(false);
    }
    loadHistory();
  }, [supabase]);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("コピーしました");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavoritePost = async (post: PostGeneration) => {
    const { error } = await supabase
      .from("post_generations")
      .update({ is_favorite: !post.is_favorite })
      .eq("id", post.id);

    if (!error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_favorite: !p.is_favorite } : p
        )
      );
    }
  };

  const toggleFavoriteReview = async (review: ReviewReply) => {
    const { error } = await supabase
      .from("review_replies")
      .update({ is_favorite: !review.is_favorite })
      .eq("id", review.id);

    if (!error) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_favorite: !r.is_favorite } : r
        )
      );
    }
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase
      .from("post_generations")
      .delete()
      .eq("id", id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("削除しました");
    }
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase
      .from("review_replies")
      .delete()
      .eq("id", id);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("削除しました");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">履歴</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("posts")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            tab === "posts"
              ? "bg-brand-600 text-white"
              : "bg-white text-gray-600 border"
          )}
        >
          <PenSquare className="w-4 h-4" />
          投稿 ({posts.length})
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            tab === "reviews"
              ? "bg-brand-600 text-white"
              : "bg-white text-gray-600 border"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          レビュー返信 ({reviews.length})
        </button>
      </div>

      {/* Posts Tab */}
      {tab === "posts" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <PenSquare className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <p>投稿履歴はまだありません</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="card">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === post.id ? null : post.id)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.theme}</span>
                      {post.is_favorite && (
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.menu_item} ・ {formatDate(post.created_at)}
                    </p>
                  </div>
                  {expandedId === post.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {expandedId === post.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {[post.output_1, post.output_2, post.output_3]
                      .filter(Boolean)
                      .map((text, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-medium text-brand-600">
                                Instagram案{i + 1}
                              </span>
                              <p className="text-sm mt-1 whitespace-pre-wrap">
                                {text}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(text, `post-${post.id}-${i}`);
                              }}
                              className="text-gray-400 hover:text-brand-600 p-1 shrink-0"
                            >
                              {copiedId === `post-${post.id}-${i}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}

                    {post.story_text && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <span className="text-xs font-medium text-purple-600">
                          ストーリー
                        </span>
                        <div className="flex items-start justify-between gap-2 mt-1">
                          <p className="text-sm">{post.story_text}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                post.story_text,
                                `story-${post.id}`
                              );
                            }}
                            className="text-gray-400 hover:text-brand-600 p-1 shrink-0"
                          >
                            {copiedId === `story-${post.id}` ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {post.line_text && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <span className="text-xs font-medium text-green-600">
                          LINE
                        </span>
                        <div className="flex items-start justify-between gap-2 mt-1">
                          <p className="text-sm whitespace-pre-wrap">
                            {post.line_text}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                post.line_text,
                                `line-${post.id}`
                              );
                            }}
                            className="text-gray-400 hover:text-brand-600 p-1 shrink-0"
                          >
                            {copiedId === `line-${post.id}` ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {post.hashtags && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-xs font-medium text-blue-600">
                          ハッシュタグ
                        </span>
                        <div className="flex items-start justify-between gap-2 mt-1">
                          <p className="text-sm text-blue-600">
                            {post.hashtags}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                post.hashtags,
                                `hash-${post.id}`
                              );
                            }}
                            className="text-gray-400 hover:text-brand-600 p-1 shrink-0"
                          >
                            {copiedId === `hash-${post.id}` ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoritePost(post);
                        }}
                        className={cn(
                          "text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                          post.is_favorite
                            ? "text-red-500 bg-red-50"
                            : "text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        <Heart
                          className={cn(
                            "w-4 h-4",
                            post.is_favorite && "fill-red-500"
                          )}
                        />
                        {post.is_favorite ? "お気に入り解除" : "お気に入り"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("この履歴を削除しますか？")) {
                            deletePost(post.id);
                          }
                        }}
                        className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <p>レビュー返信の履歴はまだありません</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="card">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedId(
                      expandedId === review.id ? null : review.id
                    )
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <StarIcon
                            key={n}
                            className={cn(
                              "w-4 h-4",
                              n <= review.star_rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      {review.is_favorite && (
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {review.review_text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                  {expandedId === review.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {expandedId === review.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-500">
                        レビュー原文
                      </span>
                      <p className="text-sm mt-1">{review.review_text}</p>
                    </div>

                    {[review.reply_1, review.reply_2, review.reply_3]
                      .filter(Boolean)
                      .map((text, i) => (
                        <div
                          key={i}
                          className="bg-brand-50 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-medium text-brand-600">
                                返信案{i + 1}
                              </span>
                              <p className="text-sm mt-1 whitespace-pre-wrap">
                                {text}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(
                                  text,
                                  `rev-${review.id}-${i}`
                                );
                              }}
                              className="text-gray-400 hover:text-brand-600 p-1 shrink-0"
                            >
                              {copiedId === `rev-${review.id}-${i}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteReview(review);
                        }}
                        className={cn(
                          "text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                          review.is_favorite
                            ? "text-red-500 bg-red-50"
                            : "text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        <Heart
                          className={cn(
                            "w-4 h-4",
                            review.is_favorite && "fill-red-500"
                          )}
                        />
                        {review.is_favorite ? "お気に入り解除" : "お気に入り"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("この履歴を削除しますか？")) {
                            deleteReview(review.id);
                          }
                        }}
                        className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
