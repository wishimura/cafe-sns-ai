import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildReviewReplyPrompt } from "@/lib/prompts";
import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは小規模カフェのGoogleレビュー返信を専門とするプロです。指定されたJSON形式で出力してください。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("AIからの応答がありませんでした");
    }

    const result = JSON.parse(content);

    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("Review reply generation error:", error);
    const message =
      error instanceof Error ? error.message : "生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
