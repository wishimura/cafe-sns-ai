"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Shop } from "@/types/database";
import {
  MessageSquare,
  Loader2,
  Sparkles,
  Star,
  AlertCircle,
  ArrowRight,
  Copy,
  Save,
  RefreshCw,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

interface GeneratedReply {
  replies: { text: string }[];
}

export default function ReviewPage() {
  const supabase = createClient();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedReply | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    reviewText: "",
    starRating: 5,
    replyTone: "grateful",
  });

  useEffect(() => {
    async function loadShop() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setShop(data);
      setLoading(false);
    }
    loadShop();
  }, [supabase]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate-review-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shop.id, ...form }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "生成に失敗しました");
      }

      const data = await response.json();
      setResult(data.result);
      toast.success("返信文を生成しました！");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "生成に失敗しました";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result || !shop) return;

    try {
      const { error } = await supabase.from("review_replies").insert({
        shop_id: shop.id,
        review_text: form.reviewText,
        star_rating: form.starRating,
        reply_tone: form.replyTone,
        reply_1: result.replies[0]?.text || "",
        reply_2: result.replies[1]?.text || "",
        reply_3: result.replies[2]?.text || "",
      });
      if (error) throw error;
      toast.success("履歴に保存しました");
    } catch {
      toast.error("保存に失敗しました");
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("コピーしました");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="card border-brand-200 bg-brand-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-brand-800">
              先に店舗情報を登録してください
            </p>
            <button
              onClick={() => router.push("/dashboard/shop")}
              className="btn-primary inline-flex items-center gap-2 mt-3 text-sm"
            >
              店舗情報を登録する
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-yellow-600" />
        <h1 className="text-2xl font-bold">Googleレビュー返信</h1>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card space-y-4">
          <div>
            <label className="label">
              レビュー本文 <span className="text-red-500">*</span>
            </label>
            <textarea
              className="textarea-field h-32"
              placeholder="Googleレビューの本文をここに貼り付けてください"
              value={form.reviewText}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reviewText: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="label">星の数</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, starRating: n }))
                  }
                  className="p-1"
                >
                  <Star
                    className={`w-7 h-7 ${
                      n <= form.starRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm text-gray-600 ml-2">
                {form.starRating}/5
              </span>
            </div>
          </div>

          <div>
            <label className="label">返信トーン</label>
            <select
              className="input-field"
              value={form.replyTone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, replyTone: e.target.value }))
              }
            >
              <option value="grateful">感謝・お礼</option>
              <option value="apologetic">お詫び・改善</option>
              <option value="neutral">バランス・丁寧</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary flex items-center gap-2 w-full justify-center py-3 text-lg"
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              返信文を生成する
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold">返信案（3案）</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerate({ preventDefault: () => {} } as React.FormEvent)}
                className="btn-secondary flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center"
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                再生成
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>

          {result.replies.map((reply, i) => (
            <div key={i} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-brand-600 mb-1 block">
                    返信案{i + 1}
                  </span>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {reply.text}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(reply.text, `reply-${i}`)}
                  className="text-gray-400 hover:text-brand-600 transition-colors p-1 shrink-0"
                >
                  {copiedId === `reply-${i}` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
