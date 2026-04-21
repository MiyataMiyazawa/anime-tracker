import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { title } = (await request.json()) as { title: string };
  if (!title?.trim()) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const prompt = `あなたはアニメの専門家です。以下のアニメタイトルについて、JSON形式で情報を返してください。

タイトル: 「${title.trim()}」

以下の形式で返してください（JSON以外のテキストは不要）:
{
  "tags": ["ジャンルや特徴を表すタグ（3〜6個、例: バトル, SF, 学園, ラブコメ, ファンタジー, 日常系, スポーツ, 2024春 など）"],
  "characters": [
    { "name": "キャラクター名", "description": "1〜2文での簡潔な説明" }
  ]
}

注意:
- tagsはそのアニメのジャンル・特徴を表す短い日本語タグにしてください
- charactersは主要キャラクター（最大5人）のみ
- 該当するアニメが不明な場合は tags を ["不明"] 、characters を空配列にしてください
- 必ず有効なJSONのみを返してください`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`[anime-info] Gemini API error: status=${res.status} title="${title.trim()}" body=${err}`);

      let userMessage = "AI情報の取得に失敗しました";
      if (res.status === 429) {
        userMessage = "リクエスト制限に達しました。少し待ってから再試行してください";
      } else if (res.status === 503) {
        userMessage = "Gemini APIが一時的に利用できません。しばらくしてから再試行してください";
      } else if (res.status === 404) {
        userMessage = "Gemini APIのモデルが見つかりません。設定を確認してください";
      }

      return Response.json(
        { error: userMessage, status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from response (might be wrapped in ```json ... ```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[anime-info] JSON parse failed: title="${title.trim()}" raw=${text}`);
      return Response.json(
        { error: "AIの応答を解析できませんでした。再試行してください" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      tags?: string[];
      characters?: { name: string; description: string }[];
    };

    return Response.json({
      tags: parsed.tags ?? [],
      characters: (parsed.characters ?? []).slice(0, 5),
    });
  } catch (e) {
    console.error(`[anime-info] Unexpected error: title="${title.trim()}"`, e);
    return Response.json(
      { error: "予期しないエラーが発生しました" },
      { status: 500 }
    );
  }
}
