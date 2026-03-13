"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Coffee, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("パスワードリセットメールを送信しました");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "エラーが発生しました";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Coffee className="w-8 h-8 text-brand-600" />
            <span className="text-2xl font-bold text-brand-800">
              カフェSNS投稿AI
            </span>
          </Link>
          <p className="text-gray-600">パスワードリセット</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-gray-700 mb-4">
                パスワードリセットのメールを送信しました。
                <br />
                メールに記載のリンクからパスワードを再設定してください。
              </p>
              <Link href="/login" className="text-brand-600 hover:underline">
                ログインに戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">メールアドレス</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="cafe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                リセットメールを送信
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
