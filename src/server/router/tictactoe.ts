import { TRPCError } from "@trpc/server";
import * as Ably from "ably/promises";
import crypto from "node:crypto";
import { prisma } from "../db/client";
import { createRouter } from "./context";

const MAX_RETRIES = 5;

export default createRouter().query("new-room", {
  async resolve({ ctx }) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error 1",
      });
    }

    const { session } = ctx;

    if (!session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized.",
      });
    }
    const clientId = `${session.user.name}_${session.user.email}`;

    // Create a new room
    // TODO: move this to redis
    let retries = 0;
    let roomId;
    while (retries <= MAX_RETRIES) {
      roomId = crypto.randomBytes(3).toString("hex");
      try {
        // eslint-disable-next-line no-await-in-loop
        await prisma.room.create({ data: { roomId } });
        break;
      } catch (e) {
        retries += 1;
      }
    }
    if (retries > MAX_RETRIES || roomId === undefined) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create a room id. Try again later.",
      });
    }

    // Generate the Ably API key to communicate within the room
    const client = new Ably.Realtime(apiKey);
    const tokenRequestData = await client.auth.createTokenRequest({
      clientId,
      capability: {
        [`control:${roomId}`]: ["publish"],
      },
    });

    return {
      roomId,
      tokenRequestData,
    };
  },
});
