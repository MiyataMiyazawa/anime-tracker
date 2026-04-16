/**
 * Gemini APIでPRのコードレビューを行い、GitHubコメントとして投稿するスクリプト
 * GitHub Actions内で実行される
 */

import { execSync } from "child_process";

const {
  GEMINI_API_KEY,
  GH_TOKEN,
  GITHUB_REPOSITORY,
  PR_NUMBER,
  BASE_REF,
} = process.env;

if (!GEMINI_API_KEY || !GH_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER || !BASE_REF) {
  console.error("必要な環境変数が不足しています");
  process.exit(1);
}

// PRの差分を取得（最大50000文字）
let diff = "";
try {
  diff = execSync(`git diff origin/${BASE_REF}...HEAD`, { maxBuffer: 10 * 1024 * 1024 })
    .toString()
    .slice(0, 50000);
} catch (e) {
  console.error("git diff の取得に失敗しました:", e.message);
  process.exit(1);
}

if (!diff.trim()) {
  console.log("差分がないためレビューをスキップします");
  process.exit(0);
}

// Gemini APIにレビューを依頼
const prompt = `あなたはNext.js PWAプロジェクト「Anime Tracker」のコードレビュアーです。
以下のPR差分をレビューして、日本語で簡潔にフィードバックしてください。

レビュー観点:
- コードの正確さ・バグの有無
- TypeScriptの型安全性
- Next.js App Routerのベストプラクティス
- Dexie.js / IndexedDBの使い方
- モバイル（iPhone PWA）向けUXの品質
- 明らかな改善点や問題点のみ指摘（些細な点はスキップ）

差分:
\`\`\`
${diff}
\`\`\`

レビュー結果を以下のフォーマットで:
### ✅ 良い点
（あれば）

### ⚠️ 改善提案
（問題点・改善案をリストで）

### 📝 メモ
（その他コメント）
`;

// 一時的な 429/503 はリトライ（指数バックオフ、最大5回）
async function callGeminiWithRetry() {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024 },
        }),
      }
    );

    if (res.ok) return res;

    const body = await res.text();
    const retriable = res.status === 429 || res.status === 503;
    console.error(`Gemini API エラー (attempt ${attempt}/${maxAttempts}, status ${res.status}):`, body);

    if (!retriable || attempt === maxAttempts) {
      throw new Error(`Gemini API failed after ${attempt} attempts: ${res.status}`);
    }

    const waitSec = Math.min(60, 2 ** attempt * 5); // 10s, 20s, 40s, 60s, 60s
    console.log(`${waitSec}秒待機してリトライします...`);
    await new Promise((r) => setTimeout(r, waitSec * 1000));
  }
}

const geminiRes = await callGeminiWithRetry();
const geminiData = await geminiRes.json();
const review = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

if (!review) {
  console.error("Gemini からのレビューが空でした");
  process.exit(1);
}

// GitHubにコメントとして投稿
const commentBody = `## 🤖 Gemini AIコードレビュー

${review}

---
*Powered by Gemini 2.5 Flash*`;

const ghRes = await fetch(
  `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments`,
  {
    method: "POST",
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({ body: commentBody }),
  }
);

if (!ghRes.ok) {
  console.error("GitHub API エラー:", await ghRes.text());
  process.exit(1);
}

console.log("✅ Geminiレビューをコメントとして投稿しました");
