"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  Store,
  Palette,
  BookOpen,
  Instagram,
  Copy,
  Check,
  PartyPopper,
} from "lucide-react";
import toast from "react-hot-toast";

const TOTAL_STEPS = 6;

const TONE_OPTIONS = [
  { value: "やさしい、親しみやすい", label: "やさしい・親しみやすい", emoji: "🌿" },
  { value: "丁寧、上品", label: "丁寧・上品", emoji: "✨" },
  { value: "カジュアル、元気", label: "カジュアル・元気", emoji: "☀️" },
  { value: "おしゃれ、洗練", label: "おしゃれ・洗練", emoji: "🎨" },
  { value: "シンプル、端的", label: "シンプル・端的", emoji: "📝" },
];

interface FormData {
  name: string;
  menu_type: string;
  address: string;
  business_hours: string;
  closed_days: string;
  atmosphere: string;
  tone: string;
  has_takeout: boolean;
  description: string;
  hashtag_policy: string;
}

interface GeneratedPost {
  instagram_posts: { text: string }[];
  story_text: string;
  line_text: string;
  hashtags: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    menu_type: "",
    address: "",
    business_hours: "",
    closed_days: "",
    atmosphere: "",
    tone: "",
    has_takeout: false,
    description: "",
    hashtag_policy: "",
  });
  const [generating, setGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      toast.error("店舗名は必須です");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleGenerateSample = async () => {
    setGenerating(true);
    setGeneratedPost(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("ログインが必要です");
        return;
      }

      // Create the shop record
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .insert({
          user_id: user.id,
          name: formData.name,
          menu_type: formData.menu_type,
          address: formData.address,
          business_hours: formData.business_hours,
          closed_days: formData.closed_days,
          atmosphere: formData.atmosphere,
          tone: formData.tone,
          has_takeout: formData.has_takeout,
          description: formData.description,
          hashtag_policy: formData.hashtag_policy,
        })
        .select()
        .single();

      if (shopError) throw shopError;
      setShopId(shop.id);

      // Generate a sample post
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          theme: "お店の紹介",
          menuItem: formData.menu_type || "おすすめメニュー",
          supplement: formData.description || "",
          toneStyle: "friendly",
          platform: "instagram",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "生成に失敗しました");
      }

      const data = await response.json();
      setGeneratedPost(data.result);
      setCurrentStep(4);
      toast.success("サンプル投稿を生成しました！");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "エラーが発生しました";
      toast.error(message);

      // If shop was created but generation failed, still advance
      if (shopId) {
        setCurrentStep(4);
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("コピーしました");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Progress dots
  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i === currentStep
              ? "bg-brand-600 scale-110"
              : i < currentStep
              ? "bg-brand-400"
              : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  );

  // Step 0: Welcome
  const StepWelcome = () => (
    <div className="text-center">
      <div className="card">
        <div className="py-4">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            ようこそ！
          </h1>
          <p className="text-gray-600 mb-2 leading-relaxed">
            カフェSNS投稿AIは、あなたのカフェの
            <br className="hidden sm:inline" />
            SNS投稿文をAIが自動生成するサービスです。
          </p>
          <p className="text-gray-500 text-sm mb-8">
            まずはお店の情報を教えてください。
            <br />
            数分で初期設定が完了します。
          </p>
          <button
            onClick={handleNext}
            className="btn-primary flex items-center gap-2 mx-auto text-lg px-8 py-3"
          >
            始める
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Step 1: Shop Basics
  const StepShopBasics = () => (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Store className="w-6 h-6 text-brand-600" />
        <h2 className="text-xl font-bold">お店の基本情報</h2>
      </div>
      <div className="card space-y-4">
        <div>
          <label className="label">
            店舗名 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            className="input-field"
            placeholder="○○カフェ"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label">提供メニューの系統</label>
          <input
            name="menu_type"
            className="input-field"
            placeholder="コーヒー、サンドイッチ、スイーツ"
            value={formData.menu_type}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            カンマ区切りで複数入力できます
          </p>
        </div>

        <div>
          <label className="label">住所</label>
          <input
            name="address"
            className="input-field"
            placeholder="東京都渋谷区..."
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">営業時間</label>
            <input
              name="business_hours"
              className="input-field"
              placeholder="9:00〜18:00"
              value={formData.business_hours}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label">定休日</label>
            <input
              name="closed_days"
              className="input-field"
              placeholder="毎週水曜日"
              value={formData.closed_days}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Atmosphere/Tone
  const StepAtmosphere = () => (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Palette className="w-6 h-6 text-brand-600" />
        <h2 className="text-xl font-bold">雰囲気・文体</h2>
      </div>
      <div className="card space-y-5">
        <div>
          <label className="label">お店の雰囲気</label>
          <input
            name="atmosphere"
            className="input-field"
            placeholder="落ち着いた、あたたかい、地域密着"
            value={formData.atmosphere}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            カンマ区切りで複数入力できます
          </p>
        </div>

        <div>
          <label className="label">文体トーン</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, tone: opt.value }))
                }
                className={`px-3 py-3 rounded-lg text-sm font-medium border transition-all ${
                  formData.tone === opt.value
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"
                }`}
              >
                <span className="block text-lg mb-0.5">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="has_takeout"
            id="has_takeout"
            className="w-4 h-4 text-brand-600 rounded"
            checked={formData.has_takeout}
            onChange={handleChange}
          />
          <label htmlFor="has_takeout" className="text-sm text-gray-700">
            テイクアウトあり
          </label>
        </div>
      </div>
    </div>
  );

  // Step 3: Menu Highlights
  const StepMenuHighlights = () => (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-6 h-6 text-brand-600" />
        <h2 className="text-xl font-bold">お店の紹介</h2>
      </div>
      <div className="card space-y-4">
        <div>
          <label className="label">お店の紹介文</label>
          <textarea
            name="description"
            className="textarea-field h-28"
            placeholder="お店の特徴や想い、自慢のメニューなどを書いてください"
            value={formData.description}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            AIがこの内容を参考に投稿文を生成します
          </p>
        </div>

        <div>
          <label className="label">ハッシュタグ方針</label>
          <textarea
            name="hashtag_policy"
            className="textarea-field h-20"
            placeholder="地域名を含める、メニュー名を含める、店名タグを入れるなど"
            value={formData.hashtag_policy}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  // Step 4: Sample Post Generation
  const StepSamplePost = () => (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Instagram className="w-6 h-6 text-pink-600" />
        <h2 className="text-xl font-bold">サンプル投稿</h2>
      </div>

      {generating ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">
              AIがサンプル投稿を生成中...
            </p>
            <p className="text-sm text-gray-400 mt-2">
              少々お待ちください
            </p>
          </div>
        </div>
      ) : generatedPost ? (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Instagram className="w-5 h-5 text-pink-600" />
              <h3 className="font-bold">Instagram投稿文</h3>
            </div>
            {generatedPost.instagram_posts?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {generatedPost.instagram_posts[0].text}
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        generatedPost.instagram_posts[0].text,
                        "sample-ig"
                      )
                    }
                    className="text-gray-400 hover:text-brand-600 transition-colors p-1 shrink-0"
                    title="コピー"
                  >
                    {copiedId === "sample-ig" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {generatedPost.hashtags && (
              <div className="mt-3">
                <p className="text-sm text-blue-600 leading-relaxed">
                  {generatedPost.hashtags}
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-500">
            このような投稿文をAIが自動生成します！
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              サンプル投稿の生成に失敗しました。
              <br />
              ダッシュボードからいつでも投稿を生成できます。
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Step 5: Completion
  const StepCompletion = () => (
    <div className="text-center">
      <div className="card">
        <div className="py-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            セットアップ完了！
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            お店の情報が登録されました。
            <br />
            さっそくダッシュボードから
            <br className="sm:hidden" />
            投稿を作成してみましょう！
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary flex items-center gap-2 mx-auto text-lg px-8 py-3"
          >
            ダッシュボードへ
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepWelcome />;
      case 1:
        return <StepShopBasics />;
      case 2:
        return <StepAtmosphere />;
      case 3:
        return <StepMenuHighlights />;
      case 4:
        return <StepSamplePost />;
      case 5:
        return <StepCompletion />;
      default:
        return null;
    }
  };

  // Determine if we show the navigation buttons
  const showNavigation = currentStep > 0 && currentStep < 4;
  const showGenerateButton = currentStep === 3;
  const showNextToComplete = currentStep === 4 && !generating;

  return (
    <div>
      <ProgressBar />

      <div className="transition-all duration-300">{renderStep()}</div>

      {/* Navigation buttons */}
      {showNavigation && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </button>

          {showGenerateButton ? (
            <button
              onClick={handleGenerateSample}
              className="btn-primary flex items-center gap-2"
              disabled={generating || !formData.name.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  サンプル投稿を生成
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn-primary flex items-center gap-2"
            >
              次へ
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Step 4: Next button to completion */}
      {showNextToComplete && (
        <div className="flex items-center justify-between mt-6">
          <div />
          <button
            onClick={() => setCurrentStep(5)}
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            完了する
          </button>
        </div>
      )}
    </div>
  );
}
