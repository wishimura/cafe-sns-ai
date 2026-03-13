"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Shop } from "@/types/database";
import {
  PenSquare,
  MessageSquare,
  Clock,
  Store,
  ArrowRight,
  AlertCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  light: 30,
  standard: -1,
};

const PLAN_LABELS: Record<string, string> = {
  free: "フリー",
  light: "ライト",
  standard: "スタンダード",
};

export default function DashboardPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({ plan: "free", count: 0 });
  const supabase = createClient();

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
      if (data) {
        setUsage({
          plan: data.plan || "free",
          count: data.usage_count || 0,
        });
      }
      setLoading(false);
    }
    loadShop();
  }, [supabase]);

  const limit = PLAN_LIMITS[usage.plan] ?? 5;
  const isUnlimited = limit === -1;
  const usagePercent = isUnlimited ? 0 : Math.min((usage.count / limit) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {!shop && (
        <div className="card mb-6 border-brand-200 bg-brand-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-brand-800">
                まずは店舗情報を登録しましょう
              </p>
              <p className="text-sm text-brand-700 mt-1">
                投稿を生成するには、先に店舗情報の登録が必要です。
              </p>
              <Link
                href="/dashboard/shop"
                className="btn-primary inline-flex items-center gap-2 mt-3 text-sm"
              >
                店舗情報を登録する
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 利用状況バー */}
      {shop && (
        <Link href="/dashboard/plan" className="card mb-6 block hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-medium">
                {PLAN_LABELS[usage.plan]}プラン
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {isUnlimited ? (
                "無制限"
              ) : (
                `${usage.count}/${limit}回使用`
              )}
            </span>
          </div>
          {!isUnlimited && (
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-brand-500"
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </Link>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/post"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
              <PenSquare className="w-6 h-6 text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg">新規投稿を作る</h2>
              <p className="text-sm text-gray-500">
                Instagram・LINE投稿文を生成
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors shrink-0" />
          </div>
        </Link>

        <Link
          href="/dashboard/review"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg">レビュー返信を作る</h2>
              <p className="text-sm text-gray-500">
                Googleレビューの返信文を生成
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors shrink-0" />
          </div>
        </Link>

        <Link
          href="/dashboard/history"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg">履歴を見る</h2>
              <p className="text-sm text-gray-500">過去の投稿・返信を確認</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors shrink-0" />
          </div>
        </Link>

        <Link
          href="/dashboard/shop"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg">店舗設定</h2>
              <p className="text-sm text-gray-500">店舗情報・文体を設定</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
