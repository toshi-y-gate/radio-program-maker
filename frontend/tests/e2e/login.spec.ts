import { test, expect } from '@playwright/test';

test('E2E-AUTH-001: ログインページ表示', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('/loginにアクセス', async () => {
    await page.goto('/login');
  });

  await test.step('メールアドレス入力欄が表示される', async () => {
    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  await test.step('パスワード入力欄が表示される', async () => {
    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  await test.step('ログインボタンが表示される', async () => {
    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeVisible();
  });
});

test('E2E-AUTH-002: 新規登録タブ切替', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('/loginにアクセス', async () => {
    await page.goto('/login');
  });

  await test.step('「新規登録」タブをクリック', async () => {
    const registerTab = page.getByRole('tab', { name: '新規登録' });
    await expect(registerTab).toBeVisible();
    await registerTab.click();
  });

  await test.step('表示名入力欄が表示される', async () => {
    const nameInput = page.locator('#reg-name');
    await expect(nameInput).toBeVisible();
  });

  await test.step('メールアドレス入力欄が表示される', async () => {
    const emailInput = page.locator('#reg-email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  await test.step('パスワード入力欄が表示される', async () => {
    const passwordInput = page.locator('#reg-password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  await test.step('登録ボタンが表示される', async () => {
    const registerButton = page.getByRole('button', { name: '登録', exact: true });
    await expect(registerButton).toBeVisible();
  });
});

test('E2E-AUTH-003: 新規登録成功', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueEmail = `test-${Date.now()}@example.com`;

  await test.step('/loginにアクセス', async () => {
    await page.goto('/login');
  });

  await test.step('「新規登録」タブをクリック', async () => {
    const registerTab = page.getByRole('tab', { name: '新規登録' });
    await expect(registerTab).toBeVisible();
    await registerTab.click();
  });

  await test.step('表示名を入力', async () => {
    const nameInput = page.locator('#reg-name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('テストユーザー');
  });

  await test.step('メールアドレスを入力', async () => {
    const emailInput = page.locator('#reg-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(uniqueEmail);
  });

  await test.step('パスワードを入力', async () => {
    const passwordInput = page.locator('#reg-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('TestPassword123!');
  });

  await test.step('登録ボタンをクリック', async () => {
    const registerButton = page.getByRole('button', { name: '登録', exact: true });
    await expect(registerButton).toBeVisible();
    await registerButton.click();
  });

  await test.step('/programに遷移することを確認', async () => {
    await page.waitForURL('**/program', { timeout: 15000 });
    expect(page.url()).toContain('/program');
  });
});

test('E2E-AUTH-004: ログイン成功', async ({ page, request }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `test-login-${uniqueId}@example.com`;
  const testPassword = 'TestPassword123!';
  const testDisplayName = 'ログインテストユーザー';

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

  await test.step('/loginにアクセス', async () => {
    await page.goto('/login');
  });

  await test.step('メールアドレスを入力', async () => {
    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);
  });

  await test.step('パスワードを入力', async () => {
    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);
  });

  await test.step('ログインボタンをクリック', async () => {
    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeVisible();
    await loginButton.click();
  });

  await test.step('/programに遷移することを確認', async () => {
    await page.waitForURL('**/program', { timeout: 15000 });
    expect(page.url()).toContain('/program');
  });
});

test('E2E-AUTH-005: バリデーションエラー表示 - 無効なメール形式', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('/loginにアクセス', async () => {
    await page.goto('/login');
  });

  await test.step('無効なメールアドレスを入力', async () => {
    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('invalid-email');
  });

  await test.step('パスワード欄をクリックしてメール欄からblur', async () => {
    const passwordInput = page.locator('#login-password');
    await passwordInput.click();
  });

  await test.step('バリデーションエラーメッセージが表示される', async () => {
    const errorMessage = page.getByText('有効なメールアドレスを入力してください');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  await test.step('ログインボタンがdisabledになっている', async () => {
    const loginButton = page.getByRole('button', { name: 'ログイン', exact: true });
    await expect(loginButton).toBeDisabled();
  });
});

test.only('E2E-AUTH-006: パスワード強度表示', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('/loginにアクセス', async () => {
    await page.goto('/login');
  });

  await test.step('「新規登録」タブをクリック', async () => {
    const registerTab = page.getByRole('tab', { name: '新規登録' });
    await expect(registerTab).toBeVisible();
    await registerTab.click();
  });

  await test.step('パスワード未入力時は強度インジケーターが非表示', async () => {
    const strengthLabel = page.getByText('パスワード強度');
    await expect(strengthLabel).not.toBeVisible();
  });

  await test.step('弱いパスワードを入力すると強度「弱」が表示される', async () => {
    const passwordInput = page.locator('#reg-password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('abc');

    // 強度インジケーターのテキストが表示される
    const strengthLabel = page.getByText('パスワード強度');
    await expect(strengthLabel).toBeVisible();

    // 強度ラベルが「弱」と表示される
    const weakLabel = page.getByText('弱');
    await expect(weakLabel).toBeVisible();
  });

  await test.step('中程度のパスワードを入力すると強度「中」が表示される', async () => {
    const passwordInput = page.locator('#reg-password');
    await passwordInput.fill('abcdefg1');

    // 強度ラベルが「中」と表示される
    const mediumLabel = page.getByText('中');
    await expect(mediumLabel).toBeVisible();
  });

  await test.step('強いパスワードを入力すると強度「強」が表示される', async () => {
    const passwordInput = page.locator('#reg-password');
    await passwordInput.fill('abcdefg1!');

    // 強度ラベルが「強」と表示される
    const strongLabel = page.getByText('強', { exact: true });
    await expect(strongLabel).toBeVisible();
  });

  await test.step('パスワードをクリアすると強度インジケーターが非表示になる', async () => {
    const passwordInput = page.locator('#reg-password');
    await passwordInput.fill('');

    const strengthLabel = page.getByText('パスワード強度');
    await expect(strengthLabel).not.toBeVisible();
  });
});
