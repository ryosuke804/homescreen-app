import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Anthropic クライアントの初期化
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// 画像検証エンドポイント
app.post('/api/validate-homescreen', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: '画像データが必要です' });
    }

    // APIキーのチェック
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('⚠️ APIキーが設定されていません。すべての画像を有効として扱います。');
      return res.json({
        isHomeScreen: true,
        reason: '検証をスキップしました（APIキーが未設定）'
      });
    }

    // base64データのみを抽出（data:image/jpeg;base64, の部分を除去）
    const base64Data = imageData.split(',')[1] || imageData;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `この画像はスマートフォンのホーム画面のスクリーンショットですか？

ホーム画面の特徴を確認してください：
- アプリアイコンが複数並んでいる
- 画面下部にドック（よく使うアプリ）がある
- 画面上部にステータスバー（時刻、バッテリーなど）がある
- 壁紙が見える

必ずJSONフォーマットで回答してください。JSON以外の文字は含めないでください：
{"isHomeScreen": true または false, "reason": "判断理由を日本語で具体的に説明"}`,
            },
          ],
        },
      ],
    });

    // レスポンスからテキストを抽出
    const responseText = message.content.find(c => c.type === 'text')?.text || '';
    console.log('Claude Response:', responseText);

    // JSONを抽出してパース
    let result = null;

    // パターン1: ```json ... ```
    let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('JSON parse error (pattern 1):', e);
      }
    }

    if (!result) {
      // パターン2: {...}
      jsonMatch = responseText.match(/\{[\s\S]*?"isHomeScreen"[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('JSON parse error (pattern 2):', e);
        }
      }
    }

    if (result && typeof result.isHomeScreen === 'boolean') {
      res.json({
        isHomeScreen: result.isHomeScreen,
        reason: result.reason || '判定理由が取得できませんでした',
      });
    } else {
      res.status(500).json({
        error: '検証結果の解析に失敗しました',
        isHomeScreen: false,
        reason: 'AIからの応答を解析できませんでした',
      });
    }
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: error.message || '検証中にエラーが発生しました',
      isHomeScreen: false,
      reason: `エラー: ${error.message}`,
    });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🚀 バックエンドサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`📝 APIキー設定: ${process.env.ANTHROPIC_API_KEY ? '✅ 設定済み' : '❌ 未設定'}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  .env ファイルに ANTHROPIC_API_KEY を設定してください');
  }
});
