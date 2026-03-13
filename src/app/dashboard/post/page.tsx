"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Shop } from "@/types/database";
import {
  PenSquare,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ImagePlus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import PostResult from "@/components/PostResult";

interface GeneratedPost {
  instagram_posts: { text: string }[];
  story_text: string;
  line_text: string;
  hashtags: string;
}

function PostPageContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    theme: "",
    menuItem: "",
    supplement: "",
    toneStyle: "friendly",
    platform: "all",
    weatherNote: "",
    hasWeatherNote: false,
    includeTakeout: false,
    includeVisitGuide: false,
  });

  // 再編集用：URLパラメータからフォームにプリフィル
  const loadFromParams = useCallback(() => {
    const theme = searchParams.get("theme");
    const menuItem = searchParams.get("menuItem");
    const supplement = searchParams.get("supplement");
    if (theme || menuItem || supplement) {
      setForm((prev) => ({
        ...prev,
        theme: theme || prev.theme,
        menuItem: menuItem || prev.menuItem,
        supplement: supplement || prev.supplement,
      }));
    }
  }, [searchParams]);

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
    loadFromParams();
  }, [supabase, loadFromParams]);

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("画像は5MB以下にしてください");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !shop) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = photoFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("post-photos")
      .upload(path, photoFile);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("post-photos").getPublicUrl(path);

    return publicUrl;
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

    let photoUrl: string | null = null;
    if (photoFile) {
      photoUrl = await uploadPhoto();
    }

    try {
      const { error } = await supabase.from("post_generations").insert({
        shop_id: shop.id,
        theme: form.theme,
        menu_item: form.menuItem,
        supplement: form.supplement,
        platform: form.platform,
        photo_url: photoUrl,
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

          {/* 写真アップロード */}
          <div>
            <label className="label">写真</label>
            {photoPreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="プレビュー"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-400 transition-colors w-full">
                <ImagePlus className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  写真を選択（5MB以下）
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-bold text-lg">オプション</h2>

          {/* 投稿媒体選択 */}
          <div>
            <label className="label">投稿媒体</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "all", label: "すべて" },
                { value: "instagram", label: "Instagram" },
                { value: "story", label: "ストーリー" },
                { value: "line", label: "LINE" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, platform: opt.value }))
                  }
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.platform === opt.value
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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
          platform={form.platform}
          onSave={handleSave}
          onRegenerate={() =>
            handleGenerate({ preventDefault: () => {} } as React.FormEvent)
          }
          generating={generating}
        />
      )}
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      }
    >
      <PostPageContent />
    </Suspense>
  );
}
