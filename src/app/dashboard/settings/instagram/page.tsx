"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { InstagramConnection } from "@/types/database";
import {
  Instagram,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Unlink,
  ExternalLink,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

function InstagramSettingsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<InstagramConnection | null>(
    null
  );
  const [disconnecting, setDisconnecting] = useState(false);
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    if (toastShown) return;

    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("Instagramとの連携が完了しました");
      setToastShown(true);
    } else if (error) {
      toast.error(error);
      setToastShown(true);
    }
  }, [searchParams, toastShown]);

  useEffect(() => {
    async function loadConnection() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!shop) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("instagram_connections")
        .select("*")
        .eq("shop_id", shop.id)
        .single();

      setConnection(data);
      setLoading(false);
    }

    loadConnection();
  }, [supabase]);

  const handleDisconnect = async () => {
    if (!confirm("Instagram連携を解除しますか？")) return;

    setDisconnecting(true);
    try {
      const res = await fetch("/api/instagram/disconnect", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "連携解除に失敗しました");
      }

      setConnection(null);
      toast.success("Instagram連携を解除しました");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "連携解除に失敗しました";
      toast.error(message);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Instagram className="w-6 h-6 text-pink-600" />
        <h1 className="text-2xl font-bold">Instagram連携</h1>
      </div>

      {/* Info card */}
      <div className="card border-blue-200 bg-blue-50 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-blue-800">
              Instagramビジネスアカウントが必要です
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Instagram連携には、Facebookページに紐づいたInstagramビジネスアカウントまたはクリエイターアカウントが必要です。
              個人アカウントでは連携できません。
            </p>
          </div>
        </div>
      </div>

      {/* Connection status card */}
      <div className="card">
        {connection ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-700">連携済み</span>
                </div>
                <p className="text-sm text-gray-600">
                  @{connection.ig_username}
                </p>
              </div>
            </div>

            {connection.token_expires_at && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">
                  トークン有効期限:{" "}
                  {new Date(connection.token_expires_at).toLocaleDateString(
                    "ja-JP"
                  )}
                </p>
                {new Date(connection.token_expires_at) < new Date() && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs text-amber-600 font-medium">
                      トークンの有効期限が切れています。再連携してください。
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="btn-secondary flex items-center gap-2 text-sm text-red-600 border-red-200 hover:bg-red-50"
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4" />
                )}
                連携解除
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Instagram className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">未連携</p>
                <p className="text-sm text-gray-500">
                  Instagramアカウントと連携すると、生成した投稿を直接投稿できます。
                </p>
              </div>
            </div>

            <a
              href="/api/instagram/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-sm transition-all bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 hover:opacity-90 shadow-md"
            >
              <Instagram className="w-5 h-5" />
              Instagramと連携する
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Warning about env vars */}
            {!process.env.NEXT_PUBLIC_SITE_URL && (
              <div className="flex items-start gap-2 mt-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-600">
                  環境変数の設定が必要な場合があります。管理者に確認してください。
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="card mt-6">
        <h2 className="font-bold text-lg mb-3">連携の流れ</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="bg-brand-100 text-brand-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </span>
            「Instagramと連携する」ボタンをクリック
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-brand-100 text-brand-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </span>
            Facebookでログインし、アクセスを許可
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-brand-100 text-brand-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </span>
            自動的にInstagramビジネスアカウントと連携
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-brand-100 text-brand-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              4
            </span>
            投稿作成画面から直接Instagramに投稿可能に
          </li>
        </ol>
      </div>
    </div>
  );
}

export default function InstagramSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      }
    >
      <InstagramSettingsContent />
    </Suspense>
  );
}
