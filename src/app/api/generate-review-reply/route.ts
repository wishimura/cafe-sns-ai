import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildReviewReplyPrompt } from "@/lib/prompts";
import { extractJSON } from "@/lib/parse-json";
import { checkAndIncrementUsage } from "@/lib/usage-limit";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

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

    // 利用回数チェック
    const usageCheck = await checkAndIncrementUsage(supabase, user.id);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.error },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { shopId, reviewText, starRating, replyTone } = body;

    if (!shopId || !reviewText || !starRating) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
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

    const prompt = buildReviewReplyPrompt({
      shop,
      reviewText,
      starRating: Number(starRating),
      replyTone: replyTone || "neutral",
    });

    const message = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `あなたは小規模カフェのGoogleレビュー返信を専門とするプロです。指定されたJSON形式で出力してください。JSONのみを返し、他のテキストは含めないでください。\n\n${prompt}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("AIからの応答がありませんでした");
    }

    const result = extractJSON(content.text);

    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("Review reply generation error:", error);
    const message =
      error instanceof Error ? error.message : "生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
