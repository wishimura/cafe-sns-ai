"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Loader2, UserPlus, Trash2, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import type { TeamMember } from "@/types/database";

export default function TeamPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [shopName, setShopName] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTeam() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user owns a shop
      const { data: ownShop } = await supabase
        .from("shops")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (ownShop) {
        setIsOwner(true);
        setShopName(ownShop.name);

        // Load team members for this shop
        const { data: teamMembers } = await supabase
          .from("team_members")
          .select("*")
          .eq("shop_id", ownShop.id)
          .order("created_at", { ascending: true });

        setMembers(teamMembers || []);
      } else {
        // Check if user is a team member
        const { data: membership } = await supabase
          .from("team_members")
          .select("*, shops(name)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (membership) {
          setIsOwner(false);
          const shopData = membership.shops as unknown as { name: string };
          setShopName(shopData?.name || "");

          // Load other team members (read-only)
          const { data: teamMembers } = await supabase
            .from("team_members")
            .select("*")
            .eq("shop_id", membership.shop_id)
            .order("created_at", { ascending: true });

          setMembers(teamMembers || []);
        }
      }
    } catch (error) {
      console.error("Failed to load team:", error);
      toast.error("チーム情報の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "招待に失敗しました");
      }

      toast.success("招待を作成しました");
      setEmail("");
      loadTeam();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "招待に失敗しました";
      toast.error(message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("このメンバーを削除しますか？")) return;

    setRemovingId(memberId);
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      toast.success("メンバーを削除しました");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("削除に失敗しました");
    } finally {
      setRemovingId(null);
    }
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("招待リンクをコピーしました");
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function getRoleBadge(role: string) {
    if (role === "owner") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
          オーナー
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        メンバー
      </span>
    );
  }

  function getStatusBadge(status: string) {
    if (status === "active") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          アクティブ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        招待中
      </span>
    );
  }

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
        <Users className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-bold">チーム管理</h1>
      </div>

      {shopName && (
        <p className="text-sm text-gray-500 mb-6">
          店舗: <span className="font-medium text-gray-700">{shopName}</span>
        </p>
      )}

      {/* Invite form - owner only */}
      {isOwner && (
        <div className="card mb-6">
          <h2 className="font-bold text-lg mb-4">メンバーを招待</h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              className="input-field flex-1"
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
              disabled={inviting}
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              招待する
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            最大5人までメンバーを招待できます
          </p>
        </div>
      )}

      {/* Team members list */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">
          チームメンバー ({members.length})
        </h2>

        {members.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            まだチームメンバーはいません。
            {isOwner && "上のフォームからメンバーを招待してください。"}
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {member.invited_email?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.invited_email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {member.status === "pending" && (
                      <button
                        onClick={() => copyInviteLink(member.invite_token)}
                        className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="招待リンクをコピー"
                      >
                        {copiedToken === member.invite_token ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="メンバーを削除"
                    >
                      {removingId === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isOwner && (
        <p className="text-xs text-gray-400 mt-4">
          チームの管理はオーナーのみが行えます。
        </p>
      )}
    </div>
  );
}
