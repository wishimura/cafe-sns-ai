"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Users, BarChart3, FileText } from "lucide-react";

interface UserStats {
  id: string;
  name: string;
  email: string;
  plan: string;
  usage_count: number;
  post_count: number;
  review_count: number;
  created_at: string;
}

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 管理者チェック
      const { data: shop } = await supabase
        .from("shops")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      if (!shop?.is_admin) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // 全店舗と利用状況を取得
      const { data: shops } = await supabase
        .from("shops")
        .select("id, name, plan, usage_count, user_id, created_at")
        .order("created_at", { ascending: false });

      if (shops) {
        const userStatsPromises = shops.map(async (s) => {
          const [postsRes, reviewsRes] = await Promise.all([
            supabase
              .from("post_generations")
              .select("id", { count: "exact", head: true })
              .eq("shop_id", s.id),
            supabase
              .from("review_replies")
              .select("id", { count: "exact", head: true })
              .eq("shop_id", s.id),
          ]);

          return {
            id: s.id,
            name: s.name,
            email: s.user_id,
            plan: s.plan || "free",
            usage_count: s.usage_count || 0,
            post_count: postsRes.count || 0,
            review_count: reviewsRes.count || 0,
            created_at: s.created_at,
          };
        });

        const stats = await Promise.all(userStatsPromises);
        setUsers(stats);

        setTotalStats({
          totalUsers: stats.length,
          totalPosts: stats.reduce((sum, u) => sum + u.post_count, 0),
          totalReviews: stats.reduce((sum, u) => sum + u.review_count, 0),
        });
      }

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
  };

  const planLabel = (plan: string) => {
    const map: Record<string, string> = {
      free: "フリー",
      light: "ライト",
      standard: "スタンダード",
    };
    return map[plan] || plan;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card text-center py-12">
        <Shield className="w-8 h-8 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">管理者権限がありません</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.totalUsers}</p>
              <p className="text-sm text-gray-500">登録ユーザー</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.totalPosts}</p>
              <p className="text-sm text-gray-500">投稿生成数</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.totalReviews}</p>
              <p className="text-sm text-gray-500">レビュー返信数</p>
            </div>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">ユーザー一覧</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-gray-500">店舗名</th>
                <th className="pb-3 font-medium text-gray-500">プラン</th>
                <th className="pb-3 font-medium text-gray-500">投稿数</th>
                <th className="pb-3 font-medium text-gray-500">返信数</th>
                <th className="pb-3 font-medium text-gray-500">利用回数</th>
                <th className="pb-3 font-medium text-gray-500">登録日</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{user.name || "未設定"}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.plan === "standard"
                          ? "bg-brand-100 text-brand-700"
                          : user.plan === "light"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {planLabel(user.plan)}
                    </span>
                  </td>
                  <td className="py-3">{user.post_count}</td>
                  <td className="py-3">{user.review_count}</td>
                  <td className="py-3">{user.usage_count}</td>
                  <td className="py-3 text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
