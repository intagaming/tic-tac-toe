// src/server/router/context.ts
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import * as Ably from "ably/promises";
import Redis from "ioredis";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import { prisma } from "../db/client";

const ablyApiKey = process.env.ABLY_API_KEY;
const ablyClient = new Ably.Realtime(ablyApiKey ?? "");
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

export const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions) => {
  const session = await unstable_getServerSession(req, res, authOptions);

  return {
    req,
    res,
    prisma,
    session,
    redis,
    ablyClient,
  };
};

type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => trpc.router<Context>();
