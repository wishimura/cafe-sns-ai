"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lightbulb, RefreshCw, AlertCircle } from "lucide-react";

interface Suggestion {
  theme: string;
  menuItem: string;
  reason: string;
}

interface TopicSuggestionsProps {
  shopId: string;
}

export default function TopicSuggestions({ shopId }: TopicSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchSuggestions = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/suggest-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, refresh }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "提案の取得に失敗しました");
        }

        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "提案の取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    },
    [shopId]
  );

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleUse = (suggestion: Suggestion) => {
    const params = new URLSearchParams({
      theme: suggestion.theme,
      menuItem: suggestion.menuItem,
    });
    router.push(`/dashboard/post?${params.toString()}`);
  };

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <h2 className="font-bold text-lg">今日のおすすめ投稿ネタ</h2>
        </div>
        <button
          onClick={() => fetchSuggestions(true)}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          更新
        </button>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 p-4 animate-pulse"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-3" />
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-gray-600 mb-3">{error}</p>
          <button
            onClick={() => fetchSuggestions()}
            className="btn-primary text-sm"
          >
            再試行
          </button>
        </div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="font-bold text-sm line-clamp-2">
                  {suggestion.theme}
                </p>
              </div>
              <p className="text-xs text-gray-600 mb-1">
                {suggestion.menuItem}
              </p>
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                {suggestion.reason}
              </p>
              <button
                onClick={() => handleUse(suggestion)}
                className="w-full text-sm py-1.5 px-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                この内容で作成
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
