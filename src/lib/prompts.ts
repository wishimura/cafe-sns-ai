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

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  zh: "中文（簡体字）",
  ko: "한국어",
};

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
  languages?: string[];
}): string {
  const toneInstruction = TONE_INSTRUCTIONS[params.toneStyle] || TONE_INSTRUCTIONS.friendly;
  const hasTranslations = params.languages && params.languages.length > 0;

  let translationInstructions = "";
  let translationJsonFormat = "";

  if (hasTranslations) {
    const langList = params.languages!
      .map((lang) => LANGUAGE_LABELS[lang] || lang)
      .join("、");

    translationInstructions = `
【多言語翻訳指示】
以下の言語に翻訳してください：${langList}
- 直訳ではなく、各言語で自然な表現に翻訳すること
- ハッシュタグも各言語に適したものに変換すること（日本語のハッシュタグをそのまま使わない）
- 各言語の文化やSNSの慣習に合わせて適切にアレンジすること
`;

    const translationEntries = params.languages!
      .map(
        (lang) => `    "${lang}": {
      "instagram_posts": [{"text": "${LANGUAGE_LABELS[lang] || lang}のInstagram投稿文1"}, {"text": "${LANGUAGE_LABELS[lang] || lang}のInstagram投稿文2"}, {"text": "${LANGUAGE_LABELS[lang] || lang}のInstagram投稿文3"}],
      "story_text": "${LANGUAGE_LABELS[lang] || lang}のストーリー文",
      "hashtags": "#hashtag1 #hashtag2 ..."
    }`
      )
      .join(",\n");

    translationJsonFormat = `,
  "translations": {
${translationEntries}
  }`;
  }

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
${translationInstructions}
以下の形式でJSON出力してください。他のテキストは一切含めないでください：
{
  "instagram_posts": [
    {"text": "Instagram投稿文1"},
    {"text": "Instagram投稿文2"},
    {"text": "Instagram投稿文3"}
  ],
  "story_text": "Instagramストーリー用の短文（50文字以内）",
  "line_text": "LINE配信用文（200文字以内、冒頭にキャッチーな1行）",
  "hashtags": "#ハッシュタグ1 #ハッシュタグ2 ..."${translationJsonFormat}
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

export function buildTopicSuggestionPrompt(params: {
  shop: { name: string; menu_type: string; atmosphere: string; tone: string; description: string };
  currentDate: string;
  dayOfWeek: string;
  season: string;
  recentThemes: string[];
}): string {
  const recentThemesText =
    params.recentThemes.length > 0
      ? `\n【最近使ったテーマ（重複を避けてください）】\n${params.recentThemes.map((t) => `- ${t}`).join("\n")}`
      : "";

  return `
あなたは小規模カフェのSNS投稿企画を提案するマーケティングの専門家です。

【店舗情報】
- 店舗名：${params.shop.name}
- 紹介文：${params.shop.description}
- 雰囲気：${params.shop.atmosphere}
- 文体トーン：${params.shop.tone}
- メニュー系統：${params.shop.menu_type}

【今日の情報】
- 日付：${params.currentDate}
- 曜日：${params.dayOfWeek}
- 季節：${params.season}
${recentThemesText}

【指示】
今日この店舗がSNSに投稿するのに最適な投稿ネタを3つ提案してください。
- 季節感、曜日（平日/週末）、時間帯の特性を考慮する
- 店舗の雰囲気やメニュー系統に合った提案をする
- 最近使ったテーマとは異なる新鮮な切り口を提案する
- 実際のカフェで使えるリアルな提案をする

以下の形式でJSON出力してください。他のテキストは一切含めないでください：
{
  "suggestions": [
    { "theme": "投稿テーマ", "menuItem": "紹介するメニュー", "reason": "この投稿が今日おすすめな理由（1文）" },
    { "theme": "投稿テーマ", "menuItem": "紹介するメニュー", "reason": "この投稿が今日おすすめな理由（1文）" },
    { "theme": "投稿テーマ", "menuItem": "紹介するメニュー", "reason": "この投稿が今日おすすめな理由（1文）" }
  ]
}
`.trim();
}
