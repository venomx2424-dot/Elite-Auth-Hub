import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "5mb" } as any));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const pubKey = process.env.CLERK_PUBLISHABLE_KEY || "";
  const isValidKey = pubKey.startsWith("pk_test_") || pubKey.startsWith("pk_live_");
  if (!isValidKey) {
    logger.warn("Invalid Clerk publishable key detected; skipping Clerk auth");
    (req as any).auth = () => ({ userId: null });
    return next();
  }
  try {
    const result = clerkMiddleware()(req, res, (err: any) => {
      if (err) {
        logger.warn({ err: err.message }, "Clerk middleware error, continuing as unauthenticated");
        (req as any).auth = () => ({ userId: null });
      }
      next();
    });
    if (result && typeof result.then === "function") {
      result.catch((err: any) => {
        logger.warn({ err: err.message }, "Clerk middleware async error, continuing as unauthenticated");
        (req as any).auth = () => ({ userId: null });
        next();
      });
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, "Clerk middleware sync error, continuing as unauthenticated");
    (req as any).auth = () => ({ userId: null });
    next();
  }
});
app.use(authMiddleware as any);

app.use("/api", router);

export default app;
