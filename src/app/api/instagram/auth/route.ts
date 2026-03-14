import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "Facebook App IDが設定されていません" },
      { status: 500 }
    );
  }

  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "https://cursor-ai-cafe-app.vercel.app"}/api/instagram/callback`;

  const scope =
    "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
