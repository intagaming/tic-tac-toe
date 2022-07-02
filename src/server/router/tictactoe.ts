import { TRPCError } from "@trpc/server";
import * as Ably from "ably/promises";
import crypto from "node:crypto";
import { z } from "zod";
import { createRouter } from "./context";

const MAX_RETRIES = 5;

type Room = {
  host: string | null;
  state: "waiting" | "playing" | "finishing";
  guest: string | null;
  data: {
    ticks: number;
    board: ("host" | "guest")[];
    turn: "host" | "guest";
    turnEndsAt: number;
  };
};

const DEFAULT_ROOM: Room = {
  host: null,
  state: "waiting",
  guest: "userId",
  data: {
    ticks: 0,
    board: [],
    turn: "host",
    turnEndsAt: -1,
  },
};

export default createRouter()
  .query("new-room", {
    async resolve({ ctx }) {
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error 1",
        });
      }

      const { session, redis } = ctx;

      let clientId;
      if (!session?.user) {
        clientId = crypto.randomUUID();
      } else {
        clientId = `${session.user.name}_${session.user.email}`;
      }

      // Create a new room
      let retries = 0;
      let roomId;
      while (retries <= MAX_RETRIES) {
        roomId = crypto.randomBytes(3).toString("hex");
        // eslint-disable-next-line no-await-in-loop
        const json = await redis.call(
          "JSON.SET",
          `room:${roomId}`,
          "$",
          JSON.stringify({ ...DEFAULT_ROOM }),
          "NX"
        );
        if (json !== null) {
          // eslint-disable-next-line no-await-in-loop
          redis.expire(`room:${roomId}`, 60); // The host has 60 seconds to join the room
          break;
        }

        retries += 1;
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
          [`control:${roomId}`]: ["publish", "presence"],
        },
      });

      return {
        clientId,
        roomId,
        tokenRequestData,
      };
    },
  })
  .mutation("join-room", {
    input: z.object({
      roomId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error 1",
        });
      }

      const { roomId } = input;

      const { session, redis } = ctx;

      let clientId;
      if (!session?.user) {
        clientId = crypto.randomUUID();
      } else {
        clientId = `${session.user.name}_${session.user.email}`;
      }

      const json = await redis.call("JSON.GET", `room:${roomId}`, "$");
      if (json === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }

      const client = new Ably.Realtime(apiKey);
      const tokenRequestData = await client.auth.createTokenRequest({
        clientId,
        capability: {
          [`control:${roomId}`]: ["publish", "presence"],
        },
      });

      return {
        clientId,
        roomId,
        tokenRequestData,
      };
    },
  });
