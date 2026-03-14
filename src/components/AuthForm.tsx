"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Coffee, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("アカウントを作成しました");
        router.push("/onboarding");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("ログインしました");
        router.push("/dashboard");
        router.refresh();
      }
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
          <p className="text-gray-600">
            {mode === "login"
              ? "アカウントにログイン"
              : "新規アカウント作成"}
          </p>
        </div>

        <div className="card">
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
            <div>
              <label className="label">パスワード</label>
              <input
                type="password"
                className="input-field"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "ログイン" : "アカウント作成"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            {mode === "login" ? (
              <>
                <Link
                  href="/reset-password"
                  className="text-brand-600 hover:underline"
                >
                  パスワードを忘れた方
                </Link>
                <p className="mt-2 text-gray-600">
                  アカウントをお持ちでない方は{" "}
                  <Link
                    href="/register"
                    className="text-brand-600 hover:underline font-medium"
                  >
                    新規登録
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-gray-600">
                既にアカウントをお持ちの方は{" "}
                <Link
                  href="/login"
                  className="text-brand-600 hover:underline font-medium"
                >
                  ログイン
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
