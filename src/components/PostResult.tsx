"use client";

import { useState } from "react";
import {
  Copy,
  Save,
  RefreshCw,
  Instagram,
  MessageCircle,
  Hash,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Globe,
  CalendarPlus,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";

interface TranslationContent {
  instagram_posts?: { text: string }[];
  story_text?: string;
  hashtags?: string;
}

interface PostResultProps {
  result: {
    instagram_posts: { text: string }[];
    story_text: string;
    line_text: string;
    hashtags: string;
  };
  platform: string;
  onSave: () => void;
  onRegenerate: () => void;
  onSchedule?: () => void;
  generating: boolean;
  translations?: Record<string, TranslationContent>;
  instagramConnected?: boolean;
  onInstagramPublish?: (postIndex: number) => void;
  instagramPublishing?: boolean;
}

const LANGUAGE_INFO: Record<string, { flag: string; label: string }> = {
  en: { flag: "\u{1F1EC}\u{1F1E7}", label: "English" },
  zh: { flag: "\u{1F1E8}\u{1F1F3}", label: "\u4E2D\u6587" },
  ko: { flag: "\u{1F1F0}\u{1F1F7}", label: "\uD55C\uAD6D\uC5B4" },
};

export default function PostResult({
  result,
  platform,
  onSave,
  onRegenerate,
  onSchedule,
  generating,
  translations,
  instagramConnected,
  onInstagramPublish,
  instagramPublishing,
}: PostResultProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openTranslations, setOpenTranslations] = useState<Record<string, boolean>>({});
  const [activeTranslationLang, setActiveTranslationLang] = useState<Record<string, string>>({});

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("コピーしました");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="text-gray-400 hover:text-brand-600 transition-colors p-1 shrink-0"
      title="コピー"
    >
      {copiedId === id ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  const toggleTranslation = (section: string) => {
    setOpenTranslations((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getActiveLang = (section: string): string => {
    if (activeTranslationLang[section]) return activeTranslationLang[section];
    if (translations) {
      const langs = Object.keys(translations);
      if (langs.length > 0) return langs[0];
    }
    return "en";
  };

  const setActiveLang = (section: string, lang: string) => {
    setActiveTranslationLang((prev) => ({ ...prev, [section]: lang }));
  };

  const hasTranslations = translations && Object.keys(translations).length > 0;
  const translationLangs = hasTranslations ? Object.keys(translations) : [];

  const showInstagram = platform === "all" || platform === "instagram";
  const showStory = platform === "all" || platform === "story";
  const showLine = platform === "all" || platform === "line";

  const TranslationSection = ({
    section,
    children,
  }: {
    section: string;
    children: (lang: string, translation: TranslationContent) => React.ReactNode;
  }) => {
    if (!hasTranslations) return null;

    const isOpen = openTranslations[section] || false;
    const activeLang = getActiveLang(section);

    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => toggleTranslation(section)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <Globe className="w-3.5 h-3.5" />
          <span>翻訳</span>
        </button>

        {isOpen && (
          <div className="mt-2 bg-blue-50 rounded-lg p-4">
            {/* Language tabs */}
            <div className="flex gap-1 mb-3">
              {translationLangs.map((lang) => {
                const info = LANGUAGE_INFO[lang] || { flag: "", label: lang };
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(section, lang)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeLang === lang
                        ? "bg-white text-brand-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    {info.flag} {info.label}
                  </button>
                );
              })}
            </div>

            {/* Translation content */}
            {translations![activeLang] && children(activeLang, translations![activeLang])}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold">生成結果</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
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
          {onSchedule && (
            <button
              onClick={onSchedule}
              className="btn-secondary flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center"
            >
              <CalendarPlus className="w-4 h-4" />
              予約
            </button>
          )}
          <button
            onClick={onSave}
            className="btn-primary flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      {/* Instagram Posts */}
      {showInstagram && result.instagram_posts?.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-600" />
            <h3 className="font-bold">Instagram投稿文（3案）</h3>
          </div>
          {result.instagram_posts.map((post, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-brand-600 mb-1 block">
                    案{i + 1}
                  </span>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {post.text}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyButton text={post.text} id={`ig-${i}`} />
                  {instagramConnected && onInstagramPublish && (
                    <button
                      onClick={() => onInstagramPublish(i)}
                      disabled={instagramPublishing}
                      className="text-pink-500 hover:text-pink-700 transition-colors p-1"
                      title="Instagramに投稿"
                    >
                      {instagramPublishing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <TranslationSection section="instagram">
            {(lang, translation) =>
              translation.instagram_posts && translation.instagram_posts.length > 0 ? (
                <div className="space-y-3">
                  {translation.instagram_posts.map((post, i) => (
                    <div key={i} className="bg-white rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-medium text-gray-400 mb-1 block">
                            案{i + 1}
                          </span>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {post.text}
                          </p>
                        </div>
                        <CopyButton text={post.text} id={`ig-${lang}-${i}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            }
          </TranslationSection>
        </div>
      )}

      {/* Story */}
      {showStory && result.story_text && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Instagram className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold">ストーリー文</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm">{result.story_text}</p>
              <CopyButton text={result.story_text} id="story" />
            </div>
          </div>

          <TranslationSection section="story">
            {(lang, translation) =>
              translation.story_text ? (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">{translation.story_text}</p>
                    <CopyButton text={translation.story_text} id={`story-${lang}`} />
                  </div>
                </div>
              ) : null
            }
          </TranslationSection>
        </div>
      )}

      {/* LINE */}
      {showLine && result.line_text && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-bold">LINE配信文</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {result.line_text}
              </p>
              <CopyButton text={result.line_text} id="line" />
            </div>
          </div>
        </div>
      )}

      {/* Hashtags */}
      {result.hashtags && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold">ハッシュタグ</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-blue-600 leading-relaxed">
                {result.hashtags}
              </p>
              <CopyButton text={result.hashtags} id="hashtags" />
            </div>
          </div>

          <TranslationSection section="hashtags">
            {(lang, translation) =>
              translation.hashtags ? (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-blue-600 leading-relaxed">
                      {translation.hashtags}
                    </p>
                    <CopyButton text={translation.hashtags} id={`hashtags-${lang}`} />
                  </div>
                </div>
              ) : null
            }
          </TranslationSection>
        </div>
      )}
    </div>
  );
}
