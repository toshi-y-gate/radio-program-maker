import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';

const BACKEND_DIR = '/home/toshi/音声クローンアプリ/backend';
const NODE_BIN = process.execPath;

test('E2E-HIST-001: ページ表示 - 検索バー・フィルター・履歴一覧（またはエンプティステート）が表示される', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-hist-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = '履歴テストユーザー';

  await test.step('APIで新規ユーザーを登録', async () => {
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName,
      },
    });
    expect(response.status()).toBe(201);
  });

  await test.step('UIからログインしてトークンを取得', async () => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);

    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await page.waitForURL('**/program', { timeout: 15000 });
  });

  await test.step('/historyにアクセス', async () => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「生成履歴」見出しが表示される', async () => {
    const heading = page.getByRole('heading', { name: '生成履歴' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  await test.step('エンプティステートが表示される（新規ユーザーのため履歴なし）', async () => {
    // 新規ユーザーなので履歴は空 → エンプティステートが表示される
    const emptyMessage = page.getByText('まだ生成履歴がありません');
    await expect(emptyMessage).toBeVisible({ timeout: 10000 });

    // 「番組を作成する」リンクが表示される
    const createLink = page.getByRole('link', { name: '番組を作成する' });
    await expect(createLink).toBeVisible();
  });
});

test('E2E-HIST-002: 履歴一覧表示 - 各履歴カード（日時・モデルバッジ・スクリプトプレビュー・話者バッジ）が表示される', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-hist2-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = '履歴一覧テストユーザー';

  let authToken = '';
  let userId = '';
  let seedHistoryId = '';

  await test.step('APIで新規ユーザーを登録してトークン取得', async () => {
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    authToken = body.token;

    // JWTデコードしてuserIdを取得
    const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    userId = payload.userId;
  });

  await test.step('Prismaで履歴データを直接挿入', async () => {
    const output = execFileSync(NODE_BIN, ['scripts/seed-history.js', userId], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    });
    const result = JSON.parse(output.trim());
    seedHistoryId = result.id;
  });

  await test.step('UIからログイン', async () => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);

    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await page.waitForURL('**/program', { timeout: 15000 });
  });

  await test.step('/historyにアクセス', async () => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「生成履歴」見出しが表示される', async () => {
    const heading = page.getByRole('heading', { name: '生成履歴' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  await test.step('履歴カードに日時が表示される', async () => {
    // timestampはISO文字列で返される。カード内のspanに表示される
    const timestampElement = page.locator('.text-muted-foreground').first();
    await expect(timestampElement).toBeVisible({ timeout: 10000 });
  });

  await test.step('履歴カードにモデルバッジ（HD）が表示される', async () => {
    const modelBadge = page.getByText('HD', { exact: true });
    await expect(modelBadge).toBeVisible({ timeout: 10000 });
  });

  await test.step('履歴カードにスクリプトプレビューが表示される', async () => {
    const scriptPreview = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(scriptPreview).toBeVisible({ timeout: 10000 });
  });

  await test.step('履歴カードに話者バッジが表示される', async () => {
    const hostBadge = page.getByText('ホスト', { exact: true });
    await expect(hostBadge).toBeVisible({ timeout: 10000 });

    const guestBadge = page.getByText('ゲスト', { exact: true });
    await expect(guestBadge).toBeVisible({ timeout: 10000 });
  });

  // テストデータのクリーンアップ
  if (seedHistoryId) {
    try {
      execFileSync(NODE_BIN, ['scripts/delete-history.js', seedHistoryId], {
        cwd: BACKEND_DIR,
        encoding: 'utf-8',
      });
    } catch {
      // クリーンアップ失敗は無視
    }
  }
});

test('E2E-HIST-003: 検索フィルタリング - 検索欄にキーワードを入力すると該当する履歴のみがフィルタリング表示される', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-hist3-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = '検索フィルタテストユーザー';

  let authToken = '';
  let userId = '';
  let seedHistoryId = '';

  await test.step('APIで新規ユーザーを登録してトークン取得', async () => {
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    authToken = body.token;

    // JWTデコードしてuserIdを取得
    const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    userId = payload.userId;
  });

  await test.step('Prismaで履歴データを直接挿入', async () => {
    const output = execFileSync(NODE_BIN, ['scripts/seed-history.js', userId], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    });
    const result = JSON.parse(output.trim());
    seedHistoryId = result.id;
  });

  await test.step('UIからログイン', async () => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);

    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await page.waitForURL('**/program', { timeout: 15000 });
  });

  await test.step('/historyにアクセス', async () => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「生成履歴」見出しが表示される', async () => {
    const heading = page.getByRole('heading', { name: '生成履歴' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  await test.step('シードデータの履歴カードが表示されていることを確認', async () => {
    const scriptPreview = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(scriptPreview).toBeVisible({ timeout: 10000 });
  });

  await test.step('検索欄にキーワード「ラジオ番組」を入力', async () => {
    const searchInput = page.getByPlaceholder('スクリプト内容で検索...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('ラジオ番組');
  });

  await test.step('検索結果にシードデータの履歴が表示される', async () => {
    // リアルタイム検索なのでAPIレスポンスを待つ
    const scriptPreview = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(scriptPreview).toBeVisible({ timeout: 10000 });
  });

  await test.step('存在しないキーワードで検索すると結果が0件になる', async () => {
    const searchInput = page.getByPlaceholder('スクリプト内容で検索...');
    await searchInput.fill('存在しないキーワードXYZ999');

    // 「条件に一致する履歴がありません。」が表示される
    const noResultMessage = page.getByText('条件に一致する履歴がありません。');
    await expect(noResultMessage).toBeVisible({ timeout: 10000 });
  });

  await test.step('検索をクリアすると元の履歴が再表示される', async () => {
    const searchInput = page.getByPlaceholder('スクリプト内容で検索...');
    await searchInput.fill('');

    const scriptPreview = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(scriptPreview).toBeVisible({ timeout: 10000 });
  });

  // テストデータのクリーンアップ
  if (seedHistoryId) {
    try {
      execFileSync(NODE_BIN, ['scripts/delete-history.js', seedHistoryId], {
        cwd: BACKEND_DIR,
        encoding: 'utf-8',
      });
    } catch {
      // クリーンアップ失敗は無視
    }
  }
});

test('E2E-HIST-004: モデルフィルター - モデルフィルターでHDまたはTurboを選択すると選択モデルの履歴のみ表示される', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-hist4-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'モデルフィルタテストユーザー';

  let authToken = '';
  let userId = '';
  let seedHdHistoryId = '';
  let seedTurboHistoryId = '';

  await test.step('APIで新規ユーザーを登録してトークン取得', async () => {
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    authToken = body.token;

    // JWTデコードしてuserIdを取得
    const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    userId = payload.userId;
  });

  await test.step('Prismaで HD モデルの履歴データを挿入', async () => {
    const output = execFileSync(NODE_BIN, ['scripts/seed-history.js', userId, 'hd'], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    });
    const result = JSON.parse(output.trim());
    seedHdHistoryId = result.id;
  });

  await test.step('Prismaで Turbo モデルの履歴データを挿入', async () => {
    const output = execFileSync(NODE_BIN, ['scripts/seed-history.js', userId, 'turbo'], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    });
    const result = JSON.parse(output.trim());
    seedTurboHistoryId = result.id;
  });

  await test.step('UIからログイン', async () => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);

    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await page.waitForURL('**/program', { timeout: 15000 });
  });

  await test.step('/historyにアクセス', async () => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「生成履歴」見出しが表示される', async () => {
    const heading = page.getByRole('heading', { name: '生成履歴' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  await test.step('初期状態でHDとTurbo両方の履歴カードが表示される', async () => {
    const hdScript = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(hdScript).toBeVisible({ timeout: 10000 });

    const turboScript = page.getByText('Turboモデルで生成されたテスト音声です');
    await expect(turboScript).toBeVisible({ timeout: 10000 });
  });

  await test.step('モデルフィルターで「HD」を選択', async () => {
    // モデルフィルターは1番目のSelectTrigger（0-indexed）
    const modelTrigger = page.locator('[data-slot="select-trigger"]').first();
    await expect(modelTrigger).toBeVisible();
    await modelTrigger.click();

    // ポップアップから「HD」を選択
    const hdOption = page.locator('[data-slot="select-item"]').filter({ hasText: 'HD' });
    await expect(hdOption).toBeVisible({ timeout: 5000 });
    await hdOption.click();
  });

  await test.step('HDモデルの履歴のみ表示される', async () => {
    // HDモデルのスクリプトが表示される
    const hdScript = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(hdScript).toBeVisible({ timeout: 10000 });

    // Turboモデルのスクリプトが表示されない
    const turboScript = page.getByText('Turboモデルで生成されたテスト音声です');
    await expect(turboScript).not.toBeVisible();
  });

  await test.step('モデルフィルターで「Turbo」を選択', async () => {
    // モデルフィルターは1番目のSelectTrigger
    const modelTrigger = page.locator('[data-slot="select-trigger"]').first();
    await expect(modelTrigger).toBeVisible();
    await modelTrigger.click();

    // ポップアップから「Turbo」を選択
    const turboOption = page.locator('[data-slot="select-item"]').filter({ hasText: 'Turbo' });
    await expect(turboOption).toBeVisible({ timeout: 5000 });
    await turboOption.click();
  });

  await test.step('Turboモデルの履歴のみ表示される', async () => {
    // Turboモデルのスクリプトが表示される
    const turboScript = page.getByText('Turboモデルで生成されたテスト音声です');
    await expect(turboScript).toBeVisible({ timeout: 10000 });

    // HDモデルのスクリプトが表示されない
    const hdScript = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(hdScript).not.toBeVisible();
  });

  await test.step('モデルフィルターで「全て」に戻す', async () => {
    // モデルフィルターは1番目のSelectTrigger
    const modelTrigger = page.locator('[data-slot="select-trigger"]').first();
    await expect(modelTrigger).toBeVisible();
    await modelTrigger.click();

    // ポップアップから「全て」を選択
    const allOption = page.locator('[data-slot="select-item"]').filter({ hasText: '全て' });
    await expect(allOption).toBeVisible({ timeout: 5000 });
    await allOption.click();
  });

  await test.step('全てのモデルの履歴が再表示される', async () => {
    const hdScript = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(hdScript).toBeVisible({ timeout: 10000 });

    const turboScript = page.getByText('Turboモデルで生成されたテスト音声です');
    await expect(turboScript).toBeVisible({ timeout: 10000 });
  });

  // テストデータのクリーンアップ
  if (seedHdHistoryId) {
    try {
      execFileSync(NODE_BIN, ['scripts/delete-history.js', seedHdHistoryId], {
        cwd: BACKEND_DIR,
        encoding: 'utf-8',
      });
    } catch {
      // クリーンアップ失敗は無視
    }
  }
  if (seedTurboHistoryId) {
    try {
      execFileSync(NODE_BIN, ['scripts/delete-history.js', seedTurboHistoryId], {
        cwd: BACKEND_DIR,
        encoding: 'utf-8',
      });
    } catch {
      // クリーンアップ失敗は無視
    }
  }
});

test('E2E-HIST-005: 履歴削除 - 履歴カードの削除ボタンをクリックするとその履歴がリストから削除される', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-hist5-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = '履歴削除テストユーザー';

  let authToken = '';
  let userId = '';
  let seedHistoryId = '';

  await test.step('APIで新規ユーザーを登録してトークン取得', async () => {
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    authToken = body.token;

    // JWTデコードしてuserIdを取得
    const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    userId = payload.userId;
  });

  await test.step('Prismaで履歴データを直接挿入', async () => {
    const output = execFileSync(NODE_BIN, ['scripts/seed-history.js', userId], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    });
    const result = JSON.parse(output.trim());
    seedHistoryId = result.id;
  });

  await test.step('UIからログイン', async () => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);

    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await page.waitForURL('**/program', { timeout: 15000 });
  });

  await test.step('/historyにアクセス', async () => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「生成履歴」見出しが表示される', async () => {
    const heading = page.getByRole('heading', { name: '生成履歴' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  await test.step('シードデータの履歴カードが表示されていることを確認', async () => {
    const scriptPreview = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(scriptPreview).toBeVisible({ timeout: 10000 });
  });

  await test.step('削除ボタンをクリック', async () => {
    const deleteButton = page.getByRole('button', { name: '削除' });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
  });

  await test.step('履歴カードがリストから削除されたことを確認', async () => {
    const scriptPreview = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(scriptPreview).not.toBeVisible({ timeout: 10000 });

    // エンプティステートが表示される（唯一の履歴を削除したため）
    const emptyMessage = page.getByText('まだ生成履歴がありません');
    await expect(emptyMessage).toBeVisible({ timeout: 10000 });
  });

  // クリーンアップ（削除済みだが念のため）
  if (seedHistoryId) {
    try {
      execFileSync(NODE_BIN, ['scripts/delete-history.js', seedHistoryId], {
        cwd: BACKEND_DIR,
        encoding: 'utf-8',
      });
    } catch {
      // 既に削除済みなのでエラーは無視
    }
  }
});

test.only('E2E-HIST-006: 再利用ナビゲーション - 「再利用」ボタンをクリックすると/programページに遷移する', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-hist6-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = '再利用ナビテストユーザー';

  let authToken = '';
  let userId = '';
  let seedHistoryId = '';

  await test.step('APIで新規ユーザーを登録してトークン取得', async () => {
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    authToken = body.token;

    // JWTデコードしてuserIdを取得
    const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    userId = payload.userId;
  });

  await test.step('Prismaで履歴データを直接挿入', async () => {
    const output = execFileSync(NODE_BIN, ['scripts/seed-history.js', userId], {
      cwd: BACKEND_DIR,
      encoding: 'utf-8',
    });
    const result = JSON.parse(output.trim());
    seedHistoryId = result.id;
  });

  await test.step('UIからログイン', async () => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);

    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await page.waitForURL('**/program', { timeout: 15000 });
  });

  await test.step('/historyにアクセス', async () => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「生成履歴」見出しが表示される', async () => {
    const heading = page.getByRole('heading', { name: '生成履歴' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  await test.step('シードデータの履歴カードが表示されていることを確認', async () => {
    const scriptPreview = page.getByText('こんにちは、今日のラジオ番組へようこそ');
    await expect(scriptPreview).toBeVisible({ timeout: 10000 });
  });

  await test.step('「再利用」リンクをクリックして/programページに遷移する', async () => {
    const reuseLink = page.getByRole('link', { name: '再利用' });
    await expect(reuseLink).toBeVisible();
    await reuseLink.click();

    // /programページに遷移したことを確認
    await page.waitForURL('**/program', { timeout: 10000 });
    expect(page.url()).toContain('/program');
  });

  // テストデータのクリーンアップ
  if (seedHistoryId) {
    try {
      execFileSync(NODE_BIN, ['scripts/delete-history.js', seedHistoryId], {
        cwd: BACKEND_DIR,
        encoding: 'utf-8',
      });
    } catch {
      // クリーンアップ失敗は無視
    }
  }
});
