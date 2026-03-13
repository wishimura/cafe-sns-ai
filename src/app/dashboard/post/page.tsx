"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Shop } from "@/types/database";
import {
  PenSquare,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import PostResult from "@/components/PostResult";

interface GeneratedPost {
  instagram_posts: { text: string }[];
  story_text: string;
  line_text: string;
  hashtags: string;
}

export default function PostPage() {
  const supabase = createClient();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [form, setForm] = useState({
    theme: "",
    menuItem: "",
    supplement: "",
    toneStyle: "friendly",
    weatherNote: "",
    hasWeatherNote: false,
    includeTakeout: false,
    includeVisitGuide: false,
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate-post", {
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
      toast.success("投稿文を生成しました！");
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
      const { error } = await supabase.from("post_generations").insert({
        shop_id: shop.id,
        theme: form.theme,
        menu_item: form.menuItem,
        supplement: form.supplement,
        platform: "all",
        output_1: result.instagram_posts[0]?.text || "",
        output_2: result.instagram_posts[1]?.text || "",
        output_3: result.instagram_posts[2]?.text || "",
        story_text: result.story_text,
        line_text: result.line_text,
        hashtags: result.hashtags,
      });
      if (error) throw error;
      toast.success("履歴に保存しました");
    } catch {
      toast.error("保存に失敗しました");
    }
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
            <p className="text-sm text-brand-700 mt-1">
              投稿を生成するには店舗情報が必要です。
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
        <PenSquare className="w-6 h-6 text-pink-600" />
        <h1 className="text-2xl font-bold">投稿作成</h1>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-bold text-lg">投稿内容</h2>

          <div>
            <label className="label">
              投稿テーマ <span className="text-red-500">*</span>
            </label>
            <input
              name="theme"
              className="input-field"
              placeholder="例：今週の新メニュー紹介、季節のおすすめ"
              value={form.theme}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">
              紹介したいメニュー <span className="text-red-500">*</span>
            </label>
            <input
              name="menuItem"
              className="input-field"
              placeholder="例：自家製チーズケーキ、季節のフルーツラテ"
              value={form.menuItem}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">補足情報・おすすめポイント</label>
            <textarea
              name="supplement"
              className="textarea-field h-24"
              placeholder="例：北海道産のクリームチーズを使用、期間限定"
              value={form.supplement}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-bold text-lg">オプション</h2>

          <div>
            <label className="label">文体スタイル</label>
            <select
              name="toneStyle"
              className="input-field"
              value={form.toneStyle}
              onChange={handleChange}
            >
              <option value="polite">丁寧め</option>
              <option value="friendly">親しみやすい</option>
              <option value="stylish">ちょっとおしゃれ</option>
              <option value="simple">シンプル</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="hasWeatherNote"
              id="hasWeatherNote"
              className="w-4 h-4 text-brand-600 rounded"
              checked={form.hasWeatherNote}
              onChange={handleChange}
            />
            <label htmlFor="hasWeatherNote" className="text-sm text-gray-700">
              季節・天気の補足を追加
            </label>
          </div>

          {form.hasWeatherNote && (
            <div>
              <input
                name="weatherNote"
                className="input-field"
                placeholder="例：梅雨の晴れ間、夏日が続く今週"
                value={form.weatherNote}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="includeTakeout"
                id="includeTakeout"
                className="w-4 h-4 text-brand-600 rounded"
                checked={form.includeTakeout}
                onChange={handleChange}
              />
              <label
                htmlFor="includeTakeout"
                className="text-sm text-gray-700"
              >
                テイクアウト案内を含める
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="includeVisitGuide"
                id="includeVisitGuide"
                className="w-4 h-4 text-brand-600 rounded"
                checked={form.includeVisitGuide}
                onChange={handleChange}
              />
              <label
                htmlFor="includeVisitGuide"
                className="text-sm text-gray-700"
              >
                来店導線を含める（住所・営業時間）
              </label>
            </div>
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
              投稿文を生成する
            </>
          )}
        </button>
      </form>

      {result && (
        <PostResult
          result={result}
          onSave={handleSave}
          onRegenerate={() => handleGenerate({ preventDefault: () => {} } as React.FormEvent)}
          generating={generating}
        />
      )}
    </div>
  );
}
