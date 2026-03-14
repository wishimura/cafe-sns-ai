import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_TEAM_SIZE = 5;

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // Get shop - must be owner
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: "店舗が見つかりません。オーナーのみ招待できます。" },
        { status: 403 }
      );
    }

    // Check team size limit
    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shop.id);

    if (count !== null && count >= MAX_TEAM_SIZE) {
      return NextResponse.json(
        { error: `チームメンバーは最大${MAX_TEAM_SIZE}人までです` },
        { status: 400 }
      );
    }

    // Check if email is already invited or active
    const { data: existing } = await supabase
      .from("team_members")
      .select("id, status")
      .eq("shop_id", shop.id)
      .eq("invited_email", email.toLowerCase())
      .single();

    if (existing) {
      const statusText = existing.status === "active" ? "既にチームメンバーです" : "既に招待済みです";
      return NextResponse.json(
        { error: statusText },
        { status: 400 }
      );
    }

    // Create invitation
    const invite_token = randomUUID();
    const { data: member, error: insertError } = await supabase
      .from("team_members")
      .insert({
        shop_id: shop.id,
        role: "member",
        invited_email: email.toLowerCase(),
        invite_token,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Team invite error:", insertError);
      return NextResponse.json(
        { error: "招待の作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invite_token: member.invite_token });
  } catch (error: unknown) {
    console.error("Team invite error:", error);
    const message =
      error instanceof Error ? error.message : "招待に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
