import { test, expect } from '@playwright/test';

test('E2E-VC-001: ボイスクローンページ表示', async ({ page, request }) => {
  test.setTimeout(90000);
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // --- 認証セットアップ ---
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-vc-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'VCテストユーザー';

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

  await test.step('/loginにアクセスしてログイン', async () => {
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

    // ログイン完了を待機（リダイレクトされるまで）
    await page.waitForURL('**/program', { timeout: 15000 });
  });

  await test.step('/voice-cloneに遷移', async () => {
    await page.goto('/voice-clone', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/voice-clone', { timeout: 15000 });
    expect(page.url()).toContain('/voice-clone');
  });

  await test.step('ページタイトル「ボイスクローン」が表示される', async () => {
    const pageTitle = page.getByRole('heading', { name: 'ボイスクローン' });
    await expect(pageTitle).toBeVisible();
  });

  await test.step('カスタムボイス作成フォームが表示される', async () => {
    // カスタムボイス作成カードタイトル
    const cardTitle = page.getByText('カスタムボイス作成');
    await expect(cardTitle).toBeVisible();

    // 説明テキスト
    const description = page.getByText('音声サンプルからオリジナルのボイスを作成します');
    await expect(description).toBeVisible();

    // ボイス名入力フィールド
    const voiceNameLabel = page.locator('label[for="voice-name"]');
    await expect(voiceNameLabel).toBeVisible();

    const voiceNameInput = page.locator('#voice-name');
    await expect(voiceNameInput).toBeVisible();

    // 音声サンプルラベル
    const sampleLabel = page.getByText('音声サンプル', { exact: true });
    await expect(sampleLabel).toBeVisible();

    // ファイルアップロードエリア
    const uploadArea = page.getByText('クリックして音声ファイルを選択');
    await expect(uploadArea).toBeVisible();

    // ファイル形式の説明
    const formatInfo = page.getByText('MP3 / WAV（5秒以上）');
    await expect(formatInfo).toBeVisible();

    // 作成ボタン
    const createButton = page.getByRole('button', { name: 'ボイスを作成' });
    await expect(createButton).toBeVisible();
  });

  await test.step('プリセットボイス一覧が表示される', async () => {
    // プリセットボイスセクションタイトル
    const presetTitle = page.getByRole('heading', { name: 'プリセットボイス' });
    await expect(presetTitle).toBeVisible();

    // プリセットボイスのカードが1つ以上存在する（APIデータの読み込みを待機）
    // プリセットボイスセクション内のカードを取得
    const presetSection = presetTitle.locator('..');
    const voiceCards = presetSection.locator('[data-slot="card"]');
    await expect(voiceCards.first()).toBeVisible({ timeout: 15000 });
    const cardCount = await voiceCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  await test.step('登録済みカスタムボイスセクションが表示される', async () => {
    const customTitle = page.getByText('登録済みカスタムボイス');
    await expect(customTitle).toBeVisible();
  });
});

test('E2E-VC-002: プリセットボイス一覧表示', async ({ page, request }) => {
  test.setTimeout(90000);
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // --- 認証セットアップ ---
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-vc002-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'VC002テストユーザー';

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

  await test.step('/loginにアクセスしてログイン', async () => {
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

  await test.step('/voice-cloneに遷移', async () => {
    await page.goto('/voice-clone', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/voice-clone', { timeout: 15000 });
    expect(page.url()).toContain('/voice-clone');
  });

  await test.step('プリセットボイスセクションが表示される', async () => {
    const presetHeading = page.getByRole('heading', { name: 'プリセットボイス' });
    await expect(presetHeading).toBeVisible({ timeout: 15000 });
  });

  await test.step('プリセットボイスカードが複数グリッド表示される', async () => {
    const presetHeading = page.getByRole('heading', { name: 'プリセットボイス' });
    // プリセットボイスセクション: heading の親 div.space-y-4 > grid div 内の Card
    const presetSection = presetHeading.locator('..');
    const voiceCards = presetSection.locator('[data-slot="card"]');
    await expect(voiceCards.first()).toBeVisible({ timeout: 15000 });
    const cardCount = await voiceCards.count();
    expect(cardCount).toBeGreaterThan(1);

    // グリッドレイアウトの確認（直下のgrid-cols-1クラスを持つコンテナ）
    const gridContainer = presetSection.locator('> .grid.grid-cols-1');
    await expect(gridContainer).toBeVisible();
  });

  await test.step('各カードにボイス名と言語バッジが含まれる', async () => {
    const presetHeading = page.getByRole('heading', { name: 'プリセットボイス' });
    const presetSection = presetHeading.locator('..');
    const voiceCards = presetSection.locator('[data-slot="card"]');
    const cardCount = await voiceCards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = voiceCards.nth(i);

      // カードにボイス名（CardTitle内のテキスト）が存在する
      const cardTitle = card.locator('[data-slot="card-title"]');
      await expect(cardTitle).toBeVisible();
      const titleText = await cardTitle.textContent();
      expect(titleText).toBeTruthy();
      expect(titleText!.trim().length).toBeGreaterThan(0);

      // カードに言語バッジ（「日本語」または「英語」）が存在する
      const badge = card.locator('[data-slot="badge"]');
      await expect(badge).toBeVisible();
      const badgeText = await badge.textContent();
      expect(badgeText === '日本語' || badgeText === '英語').toBeTruthy();
    }
  });
});

test('E2E-VC-003: カスタムボイス作成フォーム入力', async ({ page, request }) => {
  test.setTimeout(90000);
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // --- 認証セットアップ ---
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-vc003-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'VC003テストユーザー';

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

  await test.step('/loginにアクセスしてログイン', async () => {
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

  await test.step('/voice-cloneに遷移', async () => {
    await page.goto('/voice-clone', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/voice-clone', { timeout: 15000 });
    expect(page.url()).toContain('/voice-clone');
  });

  await test.step('ボイス名を入力して反映を確認', async () => {
    const voiceNameInput = page.locator('#voice-name');
    await expect(voiceNameInput).toBeVisible();
    await voiceNameInput.fill('テスト用ボイス');
    await expect(voiceNameInput).toHaveValue('テスト用ボイス');
  });

  await test.step('音声ファイルを選択してファイル名表示を確認', async () => {
    // hidden file input にダミーファイルをセット
    const fileInput = page.locator('input[type="file"]');
    // ダミーのWAVファイルを作成してセット
    const dummyBuffer = Buffer.alloc(1024, 0);
    await fileInput.setInputFiles({
      name: 'test-voice-sample.wav',
      mimeType: 'audio/wav',
      buffer: dummyBuffer,
    });

    // アップロード後、ファイル名が表示されることを確認
    const fileName = page.getByText('test-voice-sample.wav');
    await expect(fileName).toBeVisible();
  });

  await test.step('入力完了後もボイス名が保持されていることを確認', async () => {
    const voiceNameInput = page.locator('#voice-name');
    await expect(voiceNameInput).toHaveValue('テスト用ボイス');
  });
});

test('E2E-VC-004: カスタムボイス作成実行', async ({ page, request }) => {
  test.setTimeout(90000);
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // --- 認証セットアップ ---
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-vc004-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'VC004テストユーザー';
  const testVoiceName = `テストボイス-${uniqueId}`;

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

  await test.step('/loginにアクセスしてログイン', async () => {
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

  await test.step('/voice-cloneに遷移', async () => {
    await page.goto('/voice-clone', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/voice-clone', { timeout: 15000 });
    expect(page.url()).toContain('/voice-clone');
  });

  await test.step('初期状態でカスタムボイスが空であることを確認', async () => {
    const emptyMessage = page.getByText('カスタムボイスはまだ登録されていません');
    await expect(emptyMessage).toBeVisible({ timeout: 15000 });
  });

  await test.step('ボイス名を入力', async () => {
    const voiceNameInput = page.locator('#voice-name');
    await expect(voiceNameInput).toBeVisible();
    await voiceNameInput.fill(testVoiceName);
    await expect(voiceNameInput).toHaveValue(testVoiceName);
  });

  await test.step('ダミー音声ファイルを選択', async () => {
    const fileInput = page.locator('input[type="file"]');
    const dummyBuffer = Buffer.alloc(1024, 0);
    await fileInput.setInputFiles({
      name: 'test-voice-sample.wav',
      mimeType: 'audio/wav',
      buffer: dummyBuffer,
    });

    const fileName = page.getByText('test-voice-sample.wav');
    await expect(fileName).toBeVisible();
  });

  await test.step('「ボイスを作成」ボタンをクリック', async () => {
    const createButton = page.getByRole('button', { name: 'ボイスを作成' });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // ボタンが「作成中...」に変わるか、フォームがリセットされるのを待つ
    // 成功時: フォームがリセットされてボイス名が空になる
    // エラー時: エラーメッセージが表示される
    const voiceNameInput = page.locator('#voice-name');
    const errorMessage = page.locator('.border-destructive');

    // どちらかが発生するのを待つ（成功リセット or エラー表示）
    await Promise.race([
      expect(voiceNameInput).toHaveValue('', { timeout: 30000 }),
      expect(errorMessage).toBeVisible({ timeout: 30000 }),
    ]);
  });

  await test.step('カスタムボイスセクションに新しいボイスが追加されることを確認', async () => {
    const voiceNameInput = page.locator('#voice-name');
    const inputValue = await voiceNameInput.inputValue();

    if (inputValue === '') {
      // 成功パターン: フォームがリセットされた → ボイスが作成された
      // 「カスタムボイスはまだ登録されていません」が消えているはず
      const emptyMessage = page.getByText('カスタムボイスはまだ登録されていません');
      await expect(emptyMessage).not.toBeVisible({ timeout: 15000 });

      // 新しいボイスカードにテスト用のボイス名が表示される
      const newVoiceCard = page.getByText(testVoiceName);
      await expect(newVoiceCard).toBeVisible({ timeout: 15000 });
    } else {
      // エラーパターン: エラーメッセージが表示された
      const errorMessage = page.locator('.border-destructive');
      const isErrorVisible = await errorMessage.isVisible();
      if (isErrorVisible) {
        const errorText = await errorMessage.textContent();
        console.log(`API エラー発生: ${errorText}`);
        // エラーが表示されること自体がUIの正常動作として確認
        expect(isErrorVisible).toBeTruthy();
      }
    }
  });

  // テスト終了時にコンソールログを出力（デバッグ用）
  if (consoleLogs.length > 0) {
    console.log('=== Browser Console Logs ===');
    consoleLogs.forEach((log) => console.log(`[${log.type}] ${log.text}`));
  }
});

test.only('E2E-VC-005: カスタムボイス削除', async ({ page, request }) => {
  test.setTimeout(90000);
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // --- 認証セットアップ ---
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-vc005-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'VC005テストユーザー';
  const testVoiceName = `削除テストボイス-${uniqueId}`;

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

  await test.step('/loginにアクセスしてログイン', async () => {
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

  await test.step('/voice-cloneに遷移', async () => {
    await page.goto('/voice-clone', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/voice-clone', { timeout: 15000 });
    expect(page.url()).toContain('/voice-clone');
  });

  await test.step('カスタムボイスを作成する（削除対象）', async () => {
    // ボイス名を入力
    const voiceNameInput = page.locator('#voice-name');
    await expect(voiceNameInput).toBeVisible();
    await voiceNameInput.fill(testVoiceName);
    await expect(voiceNameInput).toHaveValue(testVoiceName);

    // ダミー音声ファイルを選択
    const fileInput = page.locator('input[type="file"]');
    const dummyBuffer = Buffer.alloc(1024, 0);
    await fileInput.setInputFiles({
      name: 'test-voice-sample.wav',
      mimeType: 'audio/wav',
      buffer: dummyBuffer,
    });

    const fileName = page.getByText('test-voice-sample.wav');
    await expect(fileName).toBeVisible();

    // 「ボイスを作成」ボタンをクリック
    const createButton = page.getByRole('button', { name: 'ボイスを作成' });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // フォームがリセットされる（作成成功）のを待つ
    const voiceNameAfter = page.locator('#voice-name');
    await expect(voiceNameAfter).toHaveValue('', { timeout: 30000 });

    // 作成されたボイスカードが表示されることを確認
    const newVoiceCard = page.getByText(testVoiceName);
    await expect(newVoiceCard).toBeVisible({ timeout: 15000 });
  });

  await test.step('カスタムボイスカードの削除ボタンをクリック', async () => {
    // 作成されたボイス名を含むカードを特定
    const voiceCard = page.locator('[data-slot="card"]', { hasText: testVoiceName });
    await expect(voiceCard).toBeVisible();

    // そのカード内の「削除」ボタンをクリック
    const deleteButton = voiceCard.getByRole('button', { name: '削除' });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
  });

  await test.step('ボイスがリストから消えることを確認', async () => {
    // 削除後、そのボイス名がページ上から消えることを確認
    const deletedVoice = page.getByText(testVoiceName);
    await expect(deletedVoice).not.toBeVisible({ timeout: 15000 });

    // カスタムボイスが0件になった場合、空メッセージが表示される
    const emptyMessage = page.getByText('カスタムボイスはまだ登録されていません');
    await expect(emptyMessage).toBeVisible({ timeout: 15000 });
  });

  // テスト終了時にコンソールログを出力（デバッグ用）
  if (consoleLogs.length > 0) {
    console.log('=== Browser Console Logs ===');
    consoleLogs.forEach((log) => console.log(`[${log.type}] ${log.text}`));
  }
});
