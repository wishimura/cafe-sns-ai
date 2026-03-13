import type { Shop } from "@/types/database";

function buildShopContext(shop: Shop): string {
  return `
【店舗情報】
- 店舗名：${shop.name}
- 紹介文：${shop.description}
- 雰囲気：${shop.atmosphere}
- 文体トーン：${shop.tone}
- メニュー系統：${shop.menu_type}
- テイクアウト：${shop.has_takeout ? "あり" : "なし"}
- ハッシュタグ方針：${shop.hashtag_policy}
`.trim();
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  polite: "丁寧で落ち着いた文体。敬語を基本とし、上品な印象を与える。",
  friendly: "親しみやすくフレンドリーな文体。「〜ですよ」「〜してみてね」など話しかけるような口調。",
  stylish: "おしゃれで洗練された文体。短めの文、余白を意識した表現。",
  simple: "シンプルで簡潔な文体。余計な装飾を省き、伝えたいことだけを書く。",
};

const BASE_RULES = `
【基本ルール】
- 長すぎない（Instagram投稿は200〜400文字程度）
- 絵文字は控えめに（1投稿あたり3〜5個程度）
- 店の雰囲気に合った自然な日本語
- 誇大表現を避ける
- AIっぽい不自然さを避ける
- 同じ表現の連発を避ける
- 飲食店らしい温かみのある表現
`.trim();

export function buildPostGenerationPrompt(params: {
  shop: Shop;
  theme: string;
  menuItem: string;
  supplement: string;
  toneStyle: string;
  hasWeatherNote: boolean;
  weatherNote: string;
  includeTakeout: boolean;
  includeVisitGuide: boolean;
}): string {
  const toneInstruction = TONE_INSTRUCTIONS[params.toneStyle] || TONE_INSTRUCTIONS.friendly;

  return `
あなたは小規模カフェのSNS投稿文を作成するプロのコピーライターです。

${buildShopContext(params.shop)}

【投稿内容】
- テーマ：${params.theme}
- 紹介メニュー：${params.menuItem}
- 補足情報：${params.supplement}
${params.hasWeatherNote ? `- 季節・天気の補足：${params.weatherNote}` : ""}
${params.includeTakeout ? "- テイクアウト案内を含める" : ""}
${params.includeVisitGuide ? "- 来店導線（住所・営業時間）を含める" : ""}

【文体指示】
${toneInstruction}

${BASE_RULES}

以下の形式でJSON出力してください。他のテキストは一切含めないでください：
{
  "instagram_posts": [
    {"text": "Instagram投稿文1"},
    {"text": "Instagram投稿文2"},
    {"text": "Instagram投稿文3"}
  ],
  "story_text": "Instagramストーリー用の短文（50文字以内）",
  "line_text": "LINE配信用文（200文字以内、冒頭にキャッチーな1行）",
  "hashtags": "#ハッシュタグ1 #ハッシュタグ2 ..."
}

3つのInstagram投稿文はそれぞれ異なるアプローチで書いてください。
ハッシュタグは10〜15個程度。店名、地域名、メニュー名を含めてください。
`.trim();
}

export function buildReviewReplyPrompt(params: {
  shop: Shop;
  reviewText: string;
  starRating: number;
  replyTone: string;
}): string {
  const toneMap: Record<string, string> = {
    grateful: "感謝の気持ちを込めた温かい返信",
    apologetic: "お詫びと改善の意志を示す誠実な返信",
    neutral: "バランスの取れた丁寧な返信",
  };

  const ratingContext =
    params.starRating >= 4
      ? "高評価レビューです。感謝を伝え、また来店したくなる返信を。"
      : params.starRating >= 3
      ? "普通の評価です。感謝しつつ、より良い体験を提供する意志を。"
      : "低評価レビューです。お詫びと改善の姿勢を見せつつ、過度に卑屈にならないように。攻撃的な表現は絶対に避けてください。";

  return `
あなたは小規模カフェのGoogleレビュー返信を作成するプロです。

${buildShopContext(params.shop)}

【レビュー情報】
- 星の数：${"★".repeat(params.starRating)}${"☆".repeat(5 - params.starRating)}（${params.starRating}/5）
- レビュー本文：${params.reviewText}

【返信方針】
${ratingContext}
返信トーン：${toneMap[params.replyTone] || toneMap.neutral}

【基本ルール】
- 店主として自然な日本語で返信
- 過度に長くしない（100〜200文字程度）
- お客様のコメント内容に具体的に触れる
- 低評価でも攻撃的・反論的にならない
- 改善点がある場合は前向きに受け止める
- 絵文字は最小限（0〜2個）

以下の形式でJSON出力してください。他のテキストは一切含めないでください：
{
  "replies": [
    {"text": "返信案1"},
    {"text": "返信案2"},
    {"text": "返信案3"}
  ]
}

3つの返信案はそれぞれ異なるアプローチで書いてください。
`.trim();
}
