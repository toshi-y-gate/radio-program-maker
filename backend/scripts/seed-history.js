// seed-history.js - E2Eテスト用の履歴データを挿入するスクリプト
// 使用方法: node scripts/seed-history.js <userId> [model]
// model: 'hd' (default) or 'turbo'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node scripts/seed-history.js <userId> [model]');
    process.exit(1);
  }

  const modelArg = process.argv[3] || 'hd';
  const modelValue = modelArg === 'turbo' ? 'speech-2.8-turbo' : 'speech-2.8-hd';
  const scriptText = modelArg === 'turbo'
    ? '[ナレーター] Turboモデルで生成されたテスト音声です。\n[アシスタント] 高速生成のデモです。'
    : '[ホスト] こんにちは、今日のラジオ番組へようこそ！\n[ゲスト] お招きありがとうございます。';
  const speakers = modelArg === 'turbo'
    ? ['ナレーター', 'アシスタント']
    : ['ホスト', 'ゲスト'];

  const record = await prisma.history.create({
    data: {
      script: scriptText,
      speakers: JSON.stringify(speakers),
      model: modelValue,
      filename: `radio_test_seed_${modelArg}.mp3`,
      durationSec: 30,
      settings: JSON.stringify({
        speed: 1.0,
        volume: 1.0,
        pitch: 0,
        emotion: 'neutral',
      }),
      audioUrl: `/output/radio_test_seed_${modelArg}.mp3`,
      userId,
    },
  });

  console.log(JSON.stringify({ id: record.id }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
