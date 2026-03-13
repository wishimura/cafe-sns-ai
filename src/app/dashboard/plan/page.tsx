"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Check, Loader2, Zap, Crown, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const plans = [
  {
    id: "free",
    name: "フリー",
    price: 0,
    priceLabel: "¥0",
    period: "永久無料",
    icon: Gift,
    color: "gray",
    features: [
      "月5回まで投稿生成",
      "月5回までレビュー返信",
      "履歴閲覧",
      "1店舗まで",
    ],
    limit: 5,
  },
  {
    id: "light",
    name: "ライト",
    price: 980,
    priceLabel: "¥980",
    period: "月額",
    icon: Zap,
    color: "blue",
    popular: false,
    features: [
      "月30回まで投稿生成",
      "月30回までレビュー返信",
      "履歴閲覧・お気に入り",
      "写真アップロード",
      "1店舗まで",
    ],
    limit: 30,
  },
  {
    id: "standard",
    name: "スタンダード",
    price: 2980,
    priceLabel: "¥2,980",
    period: "月額",
    icon: Crown,
    color: "brand",
    popular: true,
    features: [
      "無制限の投稿生成",
      "無制限のレビュー返信",
      "履歴閲覧・お気に入り",
      "写真アップロード",
      "優先サポート",
      "複数店舗対応（予定）",
    ],
    limit: -1,
  },
];

export default function PlanPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [usageCount, setUsageCount] = useState(0);
  const [usageResetAt, setUsageResetAt] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("plan, usage_count, usage_reset_at")
        .eq("user_id", user.id)
        .single();

      if (shop) {
        setCurrentPlan(shop.plan || "free");
        setUsageCount(shop.usage_count || 0);
        setUsageResetAt(shop.usage_reset_at);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleChangePlan = async (planId: string) => {
    if (planId === currentPlan) return;
    setChangingPlan(planId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      const { error } = await supabase
        .from("shops")
        .update({
          plan: planId,
          usage_count: 0,
          usage_reset_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setCurrentPlan(planId);
      setUsageCount(0);
      toast.success(`${plans.find((p) => p.id === planId)?.name}プランに変更しました`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "プランの変更に失敗しました";
      toast.error(message);
    } finally {
      setChangingPlan(null);
    }
  };

  const currentPlanData = plans.find((p) => p.id === currentPlan);
  const usageLimit = currentPlanData?.limit ?? 5;
  const isUnlimited = usageLimit === -1;
  const usagePercent = isUnlimited ? 0 : Math.min((usageCount / usageLimit) * 100, 100);

  const formatResetDate = () => {
    if (!usageResetAt) return "未設定";
    const reset = new Date(usageResetAt);
    reset.setMonth(reset.getMonth() + 1);
    return `${reset.getFullYear()}/${(reset.getMonth() + 1).toString().padStart(2, "0")}/${reset.getDate().toString().padStart(2, "0")}`;
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
        <CreditCard className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-bold">プラン管理</h1>
      </div>

      {/* 現在の利用状況 */}
      <div className="card mb-8">
        <h2 className="font-bold text-lg mb-4">現在の利用状況</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">現在のプラン</p>
            <p className="text-lg font-bold text-brand-700">
              {currentPlanData?.name}プラン
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">今月の利用回数</p>
            <p className="text-lg font-bold">
              {usageCount}
              {!isUnlimited && <span className="text-gray-400">/{usageLimit}回</span>}
              {isUnlimited && <span className="text-gray-400 text-sm ml-1">（無制限）</span>}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">リセット日</p>
            <p className="text-lg font-bold">{formatResetDate()}</p>
          </div>
        </div>
        {!isUnlimited && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-brand-500"
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              残り{Math.max(usageLimit - usageCount, 0)}回利用可能
            </p>
          </div>
        )}
      </div>

      {/* プラン一覧 */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const PlanIcon = plan.icon;
          return (
            <div
              key={plan.id}
              className={cn(
                "card relative",
                plan.popular && "ring-2 ring-brand-500",
                isCurrent && "bg-brand-50/50"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  おすすめ
                </div>
              )}

              <div className="text-center mb-6">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3",
                    plan.color === "brand"
                      ? "bg-brand-100"
                      : plan.color === "blue"
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  )}
                >
                  <PlanIcon
                    className={cn(
                      "w-6 h-6",
                      plan.color === "brand"
                        ? "text-brand-600"
                        : plan.color === "blue"
                        ? "text-blue-600"
                        : "text-gray-600"
                    )}
                  />
                </div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.priceLabel}</span>
                  <span className="text-sm text-gray-500 ml-1">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleChangePlan(plan.id)}
                disabled={isCurrent || changingPlan !== null}
                className={cn(
                  "w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  isCurrent
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : plan.popular
                    ? "btn-primary"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                {changingPlan === plan.id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isCurrent ? "現在のプラン" : "このプランに変更"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        ※ 現在はMVP段階のため、プラン変更は即時反映されます。正式版では決済連携を行います。
      </p>
    </div>
  );
}
