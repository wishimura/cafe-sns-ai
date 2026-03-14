"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Shop, PostTemplate } from "@/types/database";
import {
  PenSquare,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ImagePlus,
  X,
  Bookmark,
  BookmarkPlus,
  Globe,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import PostResult from "@/components/PostResult";
import TemplateList from "@/components/TemplateList";
import SaveTemplateModal from "@/components/SaveTemplateModal";
import ScheduleModal from "@/components/ScheduleModal";
import ImageEditor from "@/components/ImageEditor";

interface TranslationContent {
  instagram_posts: { text: string }[];
  story_text: string;
  hashtags: string;
}

interface GeneratedPost {
  instagram_posts: { text: string }[];
  story_text: string;
  line_text: string;
  hashtags: string;
  translations?: Record<string, TranslationContent>;
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
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateRefresh, setTemplateRefresh] = useState(0);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramPublishing, setInstagramPublishing] = useState(false);
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
    languages: [] as string[],
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

      // Check Instagram connection
      if (data) {
        const { data: igConnection } = await supabase
          .from("instagram_connections")
          .select("id")
          .eq("shop_id", data.id)
          .single();
        setInstagramConnected(!!igConnection);
      }

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

  const handleLanguageToggle = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
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

  const handleTemplateSelect = (template: PostTemplate) => {
    setForm((prev) => ({
      ...prev,
      theme: template.theme,
      menuItem: template.menu_item,
      supplement: template.supplement,
      toneStyle: template.tone_style || prev.toneStyle,
      platform: template.platform || prev.platform,
    }));
    toast.success(`テンプレート「${template.name}」を適用しました`);
  };

  const handleSaveTemplate = async (name: string) => {
    if (!shop) return;
    setSavingTemplate(true);
    try {
      const { error } = await supabase.from("post_templates").insert({
        shop_id: shop.id,
        name,
        theme: form.theme,
        menu_item: form.menuItem,
        supplement: form.supplement,
        tone_style: form.toneStyle,
        platform: form.platform,
      });
      if (error) throw error;
      toast.success("テンプレートを保存しました");
      setShowSaveTemplate(false);
      setTemplateRefresh((prev) => prev + 1);
    } catch {
      toast.error("テンプレートの保存に失敗しました");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleInstagramPublish = async (postIndex: number) => {
    if (!result || !shop) return;

    if (!photoFile) {
      toast.error("Instagramへの投稿には画像が必要です。写真をアップロードしてください。");
      return;
    }

    setInstagramPublishing(true);
    try {
      // First upload the photo to get a public URL
      const photoUrl = await uploadPhoto();
      if (!photoUrl) {
        throw new Error("画像のアップロードに失敗しました");
      }

      const postText = result.instagram_posts[postIndex]?.text || "";
      const response = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postText,
          photoUrl,
          hashtags: result.hashtags,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Instagramへの投稿に失敗しました");
      }

      toast.success("Instagramに投稿しました！");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Instagramへの投稿に失敗しました";
      toast.error(message);
    } finally {
      setInstagramPublishing(false);
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

      {/* テンプレートセクション */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-lg">テンプレート</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowSaveTemplate(true)}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <BookmarkPlus className="w-4 h-4" />
            テンプレートとして保存
          </button>
        </div>
        <TemplateList
          shopId={shop.id}
          onSelect={handleTemplateSelect}
          refreshKey={templateRefresh}
        />
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
                <div className="absolute -top-2 -right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowImageEditor(true)}
                    className="bg-brand-600 text-white rounded-full p-1 hover:bg-brand-700 transition-colors"
                    title="画像を編集"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="写真を削除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
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

          {/* 多言語対応 */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              多言語対応
            </label>
            <p className="text-xs text-gray-500 mb-2">
              選択した言語の翻訳も同時に生成します
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "en", label: "English" },
                { value: "zh", label: "中文簡体" },
                { value: "ko", label: "한국어" },
              ].map((lang) => (
                <label
                  key={lang.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-brand-600 rounded"
                    checked={form.languages.includes(lang.value)}
                    onChange={() => handleLanguageToggle(lang.value)}
                  />
                  <span className="text-sm text-gray-700">{lang.label}</span>
                </label>
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
          onSchedule={() => setShowScheduleModal(true)}
          generating={generating}
          translations={result.translations}
          instagramConnected={instagramConnected && !!photoFile}
          onInstagramPublish={handleInstagramPublish}
          instagramPublishing={instagramPublishing}
        />
      )}

      <SaveTemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        onSave={handleSaveTemplate}
        saving={savingTemplate}
      />

      {result && shop && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          postContent={result}
          platform={form.platform}
          photoUrl={photoPreview}
          shopId={shop.id}
        />
      )}

      {showImageEditor && photoFile && (
        <ImageEditor
          imageFile={photoFile}
          onSave={(editedBlob) => {
            const editedFile = new File([editedBlob], "edited-photo.jpg", {
              type: "image/jpeg",
            });
            setPhotoFile(editedFile);
            setPhotoPreview(URL.createObjectURL(editedBlob));
            setShowImageEditor(false);
            toast.success("画像を編集しました");
          }}
          onCancel={() => setShowImageEditor(false)}
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
