import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

export function getAuthMiddleware() {
  return (req: Request, res: Response, next: any) => {
    const pubKey = process.env.CLERK_PUBLISHABLE_KEY || "";
    const isValidKey = pubKey.startsWith("pk_test_") || pubKey.startsWith("pk_live_");
    if (!isValidKey) {
      return next();
    }
    if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    next();
  };
}

export function getHostMiddleware() {
  return (req: Request, res: Response, next: any) => {
    const pubKey = process.env.CLERK_PUBLISHABLE_KEY || "";
    const isValidKey = pubKey.startsWith("pk_test_") || pubKey.startsWith("pk_live_");
    if (!isValidKey) {
      return next();
    }
    if ((req as any).userRole !== "host") {
      res.status(403).json({ message: "Host access required" });
      return;
    }
    next();
  };
}

router.get("/me", async (req: any, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, req.userId)).limit(1);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
