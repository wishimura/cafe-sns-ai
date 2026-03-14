"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users, Loader2, LogIn, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type InviteState = "loading" | "valid" | "invalid" | "accepted" | "error";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const token = params.token as string;

  const [state, setState] = useState<InviteState>("loading");
  const [accepting, setAccepting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function checkInvite() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      // We cannot directly query team_members due to RLS,
      // so just show the invite page if token exists.
      // The actual validation happens on accept.
      if (token) {
        setState("valid");
      } else {
        setState("invalid");
      }
    } catch {
      setState("error");
    }
  }

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_token: token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "招待の承認に失敗しました");
      }

      setState("accepted");
      toast.success("チームに参加しました！");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "招待の承認に失敗しました";
      setErrorMessage(message);
      setState("error");
      toast.error(message);
    } finally {
      setAccepting(false);
    }
  }

  function handleLoginRedirect() {
    const returnUrl = encodeURIComponent(`/invite/${token}`);
    router.push(`/login?returnUrl=${returnUrl}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {state === "loading" && (
            <div className="py-8">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
              <p className="text-gray-500 mt-4">読み込み中...</p>
            </div>
          )}

          {state === "valid" && (
            <>
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-brand-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                チームに招待されています
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                チームに参加すると、店舗の投稿作成やレビュー返信を一緒に行えます。
              </p>

              {isLoggedIn ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  参加する
                </button>
              ) : (
                <button
                  onClick={handleLoginRedirect}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  ログインして参加
                </button>
              )}
            </>
          )}

          {state === "accepted" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                チームに参加しました！
              </h1>
              <p className="text-gray-500 text-sm">
                ダッシュボードにリダイレクトしています...
              </p>
            </>
          )}

          {state === "invalid" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                無効な招待リンク
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                この招待リンクは無効または期限切れです。
              </p>
              <button
                onClick={() => router.push("/")}
                className="btn-primary w-full"
              >
                トップページへ
              </button>
            </>
          )}

          {state === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                エラーが発生しました
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                {errorMessage || "招待の処理中にエラーが発生しました。"}
              </p>
              <button
                onClick={() => router.push("/")}
                className="btn-primary w-full"
              >
                トップページへ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
