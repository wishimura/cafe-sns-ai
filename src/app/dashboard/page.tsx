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
} from "lucide-react";

export default function DashboardPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    }
    loadShop();
  }, [supabase]);

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

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/post"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <PenSquare className="w-6 h-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">新規投稿を作る</h2>
              <p className="text-sm text-gray-500">
                Instagram・LINE投稿文を生成
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/dashboard/review"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">レビュー返信を作る</h2>
              <p className="text-sm text-gray-500">
                Googleレビューの返信文を生成
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/dashboard/history"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">履歴を見る</h2>
              <p className="text-sm text-gray-500">過去の投稿・返信を確認</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/dashboard/shop"
          className="card hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">店舗設定</h2>
              <p className="text-sm text-gray-500">店舗情報・文体を設定</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
