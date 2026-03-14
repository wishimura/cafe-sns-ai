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

    // Get instagram connection
    const { data: connection, error: connectionError } = await supabase
      .from("instagram_connections")
      .select("*")
      .eq("shop_id", shop.id)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Instagram連携が見つかりません。設定画面から連携してください。" },
        { status: 404 }
      );
    }

    if (!connection.access_token) {
      return NextResponse.json(
        { error: "アクセストークンが無効です。再連携してください。" },
        { status: 401 }
      );
    }

    // Check token expiration
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: "アクセストークンの有効期限が切れています。再連携してください。" },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { postText, photoUrl, hashtags } = body;

    if (!photoUrl) {
      return NextResponse.json(
        { error: "Instagramへの投稿には画像が必要です" },
        { status: 400 }
      );
    }

    // Build caption with hashtags
    const caption = hashtags
      ? `${postText}\n\n${hashtags}`
      : postText;

    const igUserId = connection.ig_user_id;
    const accessToken = connection.access_token;

    // Step 1: Create media container
    const createMediaRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: photoUrl,
          caption,
          access_token: accessToken,
        }),
      }
    );

    const createMediaData = await createMediaRes.json();
    if (createMediaData.error) {
      console.error("Create media error:", createMediaData.error);
      return NextResponse.json(
        {
          error: `メディアの作成に失敗しました: ${createMediaData.error.message || "不明なエラー"}`,
        },
        { status: 400 }
      );
    }

    const creationId = createMediaData.id;
    if (!creationId) {
      return NextResponse.json(
        { error: "メディアIDの取得に失敗しました" },
        { status: 500 }
      );
    }

    // Step 2: Publish the media
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishRes.json();
    if (publishData.error) {
      console.error("Publish error:", publishData.error);
      return NextResponse.json(
        {
          error: `投稿の公開に失敗しました: ${publishData.error.message || "不明なエラー"}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mediaId: publishData.id,
      message: "Instagramに投稿しました",
    });
  } catch (error: unknown) {
    console.error("Instagram publish error:", error);
    const message =
      error instanceof Error ? error.message : "投稿に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
