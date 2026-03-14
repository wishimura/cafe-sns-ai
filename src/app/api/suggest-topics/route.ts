import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildTopicSuggestionPrompt } from "@/lib/prompts";
import { extractJSON } from "@/lib/parse-json";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const dynamic = "force-dynamic";

const DAY_NAMES = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

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
    const { shopId, refresh } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: "店舗IDが必要です" },
        { status: 400 }
      );
    }

    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .eq("user_id", user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: "店舗が見つかりません" },
        { status: 404 }
      );
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // キャッシュチェック（refreshフラグがなければ）
    if (!refresh) {
      const { data: cached } = await supabase
        .from("topic_suggestions")
        .select("suggestions")
        .eq("shop_id", shopId)
        .eq("date", todayStr)
        .single();

      if (cached) {
        return NextResponse.json({ suggestions: cached.suggestions });
      }
    }

    // 最近のテーマを取得（直近5件）
    const { data: recentPosts } = await supabase
      .from("post_generations")
      .select("theme")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentThemes = recentPosts?.map((p) => p.theme).filter(Boolean) || [];

    const dayOfWeek = DAY_NAMES[today.getDay()];
    const season = getSeason(today.getMonth() + 1);

    const prompt = buildTopicSuggestionPrompt({
      shop: {
        name: shop.name,
        menu_type: shop.menu_type,
        atmosphere: shop.atmosphere,
        tone: shop.tone,
        description: shop.description,
      },
      currentDate: todayStr,
      dayOfWeek,
      season,
      recentThemes,
    });

    const message = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `あなたは小規模カフェのSNS投稿企画を提案するマーケティングの専門家です。指定されたJSON形式で出力してください。JSONのみを返し、他のテキストは含めないでください。\n\n${prompt}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("AIからの応答がありませんでした");
    }

    const result = extractJSON(content.text) as {
      suggestions: { theme: string; menuItem: string; reason: string }[];
    };

    // キャッシュに保存（upsert）
    await supabase.from("topic_suggestions").upsert(
      {
        shop_id: shopId,
        date: todayStr,
        suggestions: result.suggestions,
      },
      { onConflict: "shop_id,date" }
    );

    return NextResponse.json({ suggestions: result.suggestions });
  } catch (error: unknown) {
    console.error("Topic suggestion error:", error);
    const message =
      error instanceof Error ? error.message : "提案の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
