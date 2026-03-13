/**
 * AIの応答からJSONを抽出する。
 * ```json ... ``` で囲まれている場合や、前後に余計なテキストがある場合に対応。
 */
export function extractJSON(text: string): unknown {
  // まずそのままパースを試みる
  try {
    return JSON.parse(text);
  } catch {
    // ```json ... ``` ブロックを探す
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }

    // { から最後の } までを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("JSONの解析に失敗しました");
  }
}
