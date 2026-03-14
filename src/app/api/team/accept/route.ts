import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const { invite_token } = body;

    if (!invite_token) {
      return NextResponse.json(
        { error: "招待トークンが必要です" },
        { status: 400 }
      );
    }

    // Find the pending invitation
    const { data: invitation, error: findError } = await supabase
      .from("team_members")
      .select("*, shops(name)")
      .eq("invite_token", invite_token)
      .eq("status", "pending")
      .single();

    if (findError || !invitation) {
      return NextResponse.json(
        { error: "有効な招待が見つかりません。期限切れまたは無効なリンクです。" },
        { status: 404 }
      );
    }

    // Check if user already has a shop or is already a team member elsewhere
    const { data: existingShop } = await supabase
      .from("shops")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingShop) {
      return NextResponse.json(
        { error: "既に店舗を所有しているユーザーはチームに参加できません" },
        { status: 400 }
      );
    }

    const { data: existingMembership } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "既に別のチームに所属しています" },
        { status: 400 }
      );
    }

    // Accept the invitation
    const { error: updateError } = await supabase
      .from("team_members")
      .update({
        user_id: user.id,
        status: "active",
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Team accept error:", updateError);
      return NextResponse.json(
        { error: "招待の承認に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Team accept error:", error);
    const message =
      error instanceof Error ? error.message : "招待の承認に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
