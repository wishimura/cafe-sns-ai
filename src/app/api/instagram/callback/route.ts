import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cursor-ai-cafe-app.vercel.app";
  const settingsUrl = `${baseUrl}/dashboard/settings/instagram`;

  if (errorParam) {
    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent("認証がキャンセルされました")}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent("認証コードが取得できませんでした")}`
    );
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${baseUrl}/api/instagram/callback`;

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent("Facebook API設定が不足しています")}`
    );
  }

  try {
    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch(
      "https://graph.facebook.com/v21.0/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        }),
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent("アクセストークンの取得に失敗しました")}`
      );
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange short-lived for long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );

    const longTokenData = await longTokenRes.json();
    if (!longTokenData.access_token) {
      console.error("Long-lived token exchange failed:", longTokenData);
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent("長期トークンの取得に失敗しました")}`
      );
    }

    const longLivedToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in; // seconds

    // Step 3: Get user's Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`
    );

    const pagesData = await pagesRes.json();
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent("Facebookページが見つかりません。ビジネスアカウントに紐づくページが必要です。")}`
      );
    }

    const page = pagesData.data[0];
    const pageId = page.id;

    // Step 4: Get Instagram Business Account ID from the page
    const igAccountRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${longLivedToken}`
    );

    const igAccountData = await igAccountRes.json();
    if (!igAccountData.instagram_business_account?.id) {
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent("Instagramビジネスアカウントが見つかりません。FacebookページとInstagramビジネスアカウントが連携されているか確認してください。")}`
      );
    }

    const igUserId = igAccountData.instagram_business_account.id;

    // Step 5: Get IG username
    const igUserRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}?fields=username&access_token=${longLivedToken}`
    );

    const igUserData = await igUserRes.json();
    const igUsername = igUserData.username || "unknown";

    // Step 6: Get authenticated Supabase user
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent("ログインが必要です")}`
      );
    }

    // Step 7: Get user's shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent("店舗情報が見つかりません。先に店舗情報を登録してください。")}`
      );
    }

    // Step 8: Calculate token expiration
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Step 9: Upsert into instagram_connections table
    const { error: upsertError } = await supabase
      .from("instagram_connections")
      .upsert(
        {
          shop_id: shop.id,
          access_token: longLivedToken,
          ig_user_id: igUserId,
          ig_username: igUsername,
          token_expires_at: tokenExpiresAt,
        },
        { onConflict: "shop_id" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent("接続情報の保存に失敗しました")}`
      );
    }

    // Step 10: Redirect to settings page with success
    return NextResponse.redirect(`${settingsUrl}?connected=true`);
  } catch (error) {
    console.error("Instagram callback error:", error);
    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent("Instagram連携中にエラーが発生しました")}`
    );
  }
}
