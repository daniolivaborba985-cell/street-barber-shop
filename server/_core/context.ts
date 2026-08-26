import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getUserFromAdminSession } from "../admin";

export const ADMIN_SESSION_COOKIE = "street_admin_session";

function readCookie(header: string | undefined, name: string) {
  const value = header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined;
}

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const adminToken = readCookie(opts.req.headers.cookie, ADMIN_SESSION_COOKIE);

  // A sessão local do painel tem prioridade para que um OAuth comum não pule o login interno.
  if (adminToken) {
    try {
      user = (await getUserFromAdminSession(adminToken)) ?? null;
    } catch {
      user = null;
    }
  }

  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
