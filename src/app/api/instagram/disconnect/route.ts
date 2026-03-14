import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Get user's shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: "店舗情報が見つかりません" },
        { status: 404 }
      );
    }

    // Delete instagram connection
    const { error: deleteError } = await supabase
      .from("instagram_connections")
      .delete()
      .eq("shop_id", shop.id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "連携解除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instagram連携を解除しました",
    });
  } catch (error: unknown) {
    console.error("Instagram disconnect error:", error);
    const message =
      error instanceof Error ? error.message : "連携解除に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
