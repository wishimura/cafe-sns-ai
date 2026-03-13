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
} from "lucide-react";
import toast from "react-hot-toast";

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
  generating: boolean;
}

export default function PostResult({
  result,
  platform,
  onSave,
  onRegenerate,
  generating,
}: PostResultProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const showInstagram = platform === "all" || platform === "instagram";
  const showStory = platform === "all" || platform === "story";
  const showLine = platform === "all" || platform === "line";

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
                <CopyButton text={post.text} id={`ig-${i}`} />
              </div>
            </div>
          ))}
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
        </div>
      )}
    </div>
  );
}
