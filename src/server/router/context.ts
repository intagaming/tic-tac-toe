// src/server/router/context.ts
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import { prisma } from "../db/client";

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
  };
};

type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => trpc.router<Context>();
