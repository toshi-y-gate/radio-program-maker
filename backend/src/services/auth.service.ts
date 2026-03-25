import { prisma } from "../db";
import { hashPassword, verifyPassword } from "../utils/password";
import { generateToken } from "../middleware/auth";

export type AuthResult = {
  user: { email: string; displayName: string };
  token: string;
};

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  const hashed = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("このメールアドレスは既に登録されています");
    }
    return tx.user.create({
      data: { email, password: hashed, displayName },
    });
  });

  const token = generateToken(user.id);
  return {
    user: { email: user.email, displayName: user.displayName },
    token,
  };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("メールアドレスまたはパスワードが正しくありません");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error("メールアドレスまたはパスワードが正しくありません");
  }

  const token = generateToken(user.id);
  return {
    user: { email: user.email, displayName: user.displayName },
    token,
  };
}

export async function getMe(
  userId: string
): Promise<{ email: string; displayName: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, displayName: true },
  });
  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }
  return user;
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }
  await prisma.user.delete({ where: { id: userId } });
}
