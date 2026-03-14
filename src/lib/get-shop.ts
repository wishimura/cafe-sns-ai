import { SupabaseClient } from "@supabase/supabase-js";

export async function getAccessibleShop(supabase: SupabaseClient, userId: string) {
  // First try own shop
  const { data: ownShop } = await supabase
    .from("shops")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (ownShop) return { shop: ownShop, role: "owner" as const };

  // Check team membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("shop_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (membership) {
    const { data: shop } = await supabase
      .from("shops")
      .select("*")
      .eq("id", membership.shop_id)
      .single();
    if (shop) return { shop, role: membership.role as "owner" | "member" };
  }

  return null;
}
