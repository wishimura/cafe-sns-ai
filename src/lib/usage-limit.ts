import { SupabaseClient } from "@supabase/supabase-js";

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  light: 30,
  standard: -1, // 無制限
};

export async function checkAndIncrementUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; shop: { id: string }; error?: string }> {
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, plan, usage_count, usage_reset_at")
    .eq("user_id", userId)
    .single();

  if (shopError || !shop) {
    return { allowed: false, shop: { id: "" }, error: "店舗が見つかりません。先に店舗情報を登録してください。" };
  }

  const plan = shop.plan || "free";
  const limit = PLAN_LIMITS[plan] ?? 5;
  let usageCount = shop.usage_count || 0;

  // 月次リセットチェック
  if (shop.usage_reset_at) {
    const resetDate = new Date(shop.usage_reset_at);
    const now = new Date();
    const monthDiff =
      (now.getFullYear() - resetDate.getFullYear()) * 12 +
      (now.getMonth() - resetDate.getMonth());

    if (monthDiff >= 1) {
      // リセット
      usageCount = 0;
      await supabase
        .from("shops")
        .update({
          usage_count: 0,
          usage_reset_at: now.toISOString(),
        })
        .eq("id", shop.id);
    }
  } else {
    // 初回: リセット日を設定
    await supabase
      .from("shops")
      .update({ usage_reset_at: new Date().toISOString() })
      .eq("id", shop.id);
  }

  // 無制限プランは常に許可
  if (limit === -1) {
    await supabase
      .from("shops")
      .update({ usage_count: usageCount + 1 })
      .eq("id", shop.id);
    return { allowed: true, shop: { id: shop.id } };
  }

  // 制限チェック
  if (usageCount >= limit) {
    return {
      allowed: false,
      shop: { id: shop.id },
      error: `今月の利用回数上限（${limit}回）に達しました。プランをアップグレードしてください。`,
    };
  }

  // 利用回数インクリメント
  await supabase
    .from("shops")
    .update({ usage_count: usageCount + 1 })
    .eq("id", shop.id);

  return { allowed: true, shop: { id: shop.id } };
}
