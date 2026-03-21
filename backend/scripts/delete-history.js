// delete-history.js - E2Eテスト用の履歴データを削除するスクリプト
// 使用方法: node scripts/delete-history.js <historyId>
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const historyId = process.argv[2];
  if (!historyId) {
    console.error('Usage: node scripts/delete-history.js <historyId>');
    process.exit(1);
  }

  await prisma.history.delete({ where: { id: historyId } }).catch(() => {});
  console.log('deleted');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
