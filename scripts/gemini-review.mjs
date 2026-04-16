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

const geminiRes = await fetch(
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

if (!geminiRes.ok) {
  console.error("Gemini API エラー:", await geminiRes.text());
  process.exit(1);
}

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
