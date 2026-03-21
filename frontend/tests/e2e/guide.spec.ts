import { test, expect } from '@playwright/test';

test('E2E-GUIDE-001: ページ表示 - 全セクションが表示される', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-guide-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'ガイドテストユーザー';

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

  await test.step('/guideにアクセス', async () => {
    await page.goto('/guide', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「使い方ガイド」見出しが表示される', async () => {
    const heading = page.getByRole('heading', { name: '使い方ガイド' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  await test.step('クイックスタートガイドセクションが表示される', async () => {
    const section = page.getByText('クイックスタートガイド');
    await expect(section).toBeVisible();
  });

  await test.step('スクリプトの書き方セクションが表示される', async () => {
    const section = page.getByText('スクリプトの書き方');
    await expect(section).toBeVisible();
  });

  await test.step('話者についてセクションが表示される', async () => {
    const section = page.getByText('話者について');
    await expect(section).toBeVisible();
  });

  await test.step('ボイスクローン機能の使い方セクションが表示される', async () => {
    const section = page.getByText('ボイスクローン機能の使い方');
    await expect(section).toBeVisible();
  });

  await test.step('BGM設定の使い方セクションが表示される', async () => {
    const section = page.getByText('BGM設定の使い方');
    await expect(section).toBeVisible();
  });

  await test.step('Turboプレビューモードセクションが表示される', async () => {
    const section = page.getByText('Turboプレビューモード');
    await expect(section).toBeVisible();
  });

  await test.step('よくある質問（FAQ）セクションが表示される', async () => {
    const section = page.getByText('よくある質問（FAQ）');
    await expect(section).toBeVisible();
  });
});

test('E2E-GUIDE-002: スクリプト書式例表示 - コードブロックにスクリプトの書式例が表示されている', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-guide002-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'ガイドテストユーザー002';

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

  await test.step('/guideにアクセス', async () => {
    await page.goto('/guide', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「スクリプトの書き方」セクションが表示される', async () => {
    const sectionTitle = page.getByText('スクリプトの書き方');
    await expect(sectionTitle).toBeVisible({ timeout: 10000 });
  });

  await test.step('書式例のコードブロック（pre要素）が存在する', async () => {
    const preElements = page.locator('pre');
    const count = await preElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  await test.step('コードブロックに[話者名]形式の書式例が含まれている', async () => {
    const firstPre = page.locator('pre').first();
    await expect(firstPre).toBeVisible();
    await expect(firstPre).toContainText('[話者名] セリフテキスト');
  });

  await test.step('コードブロックに【話者名】形式の書式例が含まれている', async () => {
    const firstPre = page.locator('pre').first();
    await expect(firstPre).toContainText('【話者名】 セリフテキスト');
  });

  await test.step('コードブロックにコロン形式の書式例が含まれている', async () => {
    const firstPre = page.locator('pre').first();
    await expect(firstPre).toContainText('話者名: セリフテキスト');
  });

  await test.step('掛け合い例のコードブロックが存在する', async () => {
    const preElements = page.locator('pre');
    const secondPre = preElements.nth(1);
    await expect(secondPre).toBeVisible();
    await expect(secondPre).toContainText('[ホスト]');
    await expect(secondPre).toContainText('[ゲスト]');
  });
});

test.only('E2E-GUIDE-003: 全セクション表示確認 - ページスクロールで全7セクションのカードが存在し内容が空でない', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-guide003-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'ガイドテストユーザー003';

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

  await test.step('/guideにアクセス', async () => {
    await page.goto('/guide', { waitUntil: 'domcontentloaded' });
  });

  await test.step('「使い方ガイド」見出しが表示される', async () => {
    const heading = page.getByRole('heading', { name: '使い方ガイド' });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  // 全7セクションのタイトル一覧
  const sectionTitles = [
    'クイックスタートガイド',
    'スクリプトの書き方',
    '話者について',
    'ボイスクローン機能の使い方',
    'BGM設定の使い方',
    'Turboプレビューモード',
    'よくある質問（FAQ）',
  ];

  for (const title of sectionTitles) {
    await test.step(`セクション「${title}」のカードが存在し、スクロールで表示され、内容が空でない`, async () => {
      // CardTitleはdiv要素（data-slot="card-title"）なのでgetByTextで探す
      const cardTitle = page.locator('[data-slot="card-title"]', { hasText: title });
      // スクロールして表示範囲に入れる
      await cardTitle.scrollIntoViewIfNeeded();
      await expect(cardTitle).toBeVisible();

      // CardTitleの親Card要素（data-slot="card"）を取得
      const card = cardTitle.locator('xpath=ancestor::div[@data-slot="card"]');
      await expect(card).toBeVisible();

      // カード内のCardContent（data-slot="card-content"）が存在し内容が空でないことを確認
      const cardContent = card.locator('[data-slot="card-content"]');
      await expect(cardContent).toBeVisible();
      const contentText = await cardContent.textContent();
      expect(contentText).toBeTruthy();
      expect(contentText!.trim().length).toBeGreaterThan(0);
    });
  }
});
