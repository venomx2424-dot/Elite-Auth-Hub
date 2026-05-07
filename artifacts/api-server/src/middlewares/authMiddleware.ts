import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const HOST_EMAILS = new Set(["venomx2424@gmail.com", "knightxvenom@gmail.com"]);

async function getOrCreateUser(clerkUserId: string): Promise<typeof usersTable.$inferSelect> {
  const [existing] = await db.select().from(usersTable)
    .where(eq(usersTable.mobile, clerkUserId)).limit(1);

  if (existing) return existing;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  const firstName = clerkUser.firstName ?? null;
  const lastName = clerkUser.lastName ?? null;
  const username = firstName
    ? [firstName, lastName].filter(Boolean).join(" ")
    : email?.split("@")[0] ?? `user_${clerkUserId.slice(5, 13)}`;
  const isHost = email ? HOST_EMAILS.has(email.toLowerCase()) : false;
  const role = isHost ? "host" : "player";

  const [user] = await db.insert(usersTable).values({
    username,
    email,
    mobile: clerkUserId,
    passwordHash: "$clerk$",
    role,
    loginMethod: "clerk",
  }).returning();

  return user;
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    (req as any).isAuthenticated = () => false;
    return next();
  }

  try {
    const user = await getOrCreateUser(clerkUserId);
    (req as any).userId = user.id;
    (req as any).userRole = user.role;
    (req as any).isAuthenticated = () => true;
    (req as any).user = user;
    next();
  } catch (err) {
    (req as any).log?.error({ err }, "Auth middleware error");
    (req as any).isAuthenticated = () => false;
    next();
  }
}
